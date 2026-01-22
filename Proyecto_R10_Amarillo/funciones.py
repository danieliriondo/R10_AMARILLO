import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.nn import Linear, Parameter
from torch_geometric.nn.conv import MessagePassing
from torch_geometric.nn import MessagePassing
from torch_geometric.utils import add_self_loops, degree, softmax, scatter
import numpy as np
import itertools

class GCNLayer(MessagePassing):
    def __init__(self, in_channels, out_channels):
        super().__init__(aggr='add') 
        self.lin = Linear(in_channels, out_channels, bias=False)
        self.bias = torch.nn.Parameter(torch.Tensor(out_channels))
        self.reset_parameters()

    def reset_parameters(self):
        self.lin.reset_parameters()
        self.bias.data.fill_(0)

    def forward(self, x, edge_index):
        edge_index, _ = add_self_loops(edge_index, num_nodes=x.size(0))

        x = self.lin(x)

        row, col = edge_index
        deg = degree(col, x.size(0), dtype=x.dtype)
        deg_inv_sqrt = deg.pow(-0.5)
        deg_inv_sqrt[deg_inv_sqrt == float('inf')] = 0
        norm = deg_inv_sqrt[row] * deg_inv_sqrt[col]

        out = self.propagate(edge_index, x=x, norm=norm)

        out += self.bias
        return out

    def message(self, x_j, norm):
        return norm.view(-1, 1) * x_j
    
class GraphSage(MessagePassing):
    def __init__(self, in_channels, out_channels, normalize=True, **kwargs):
        super(GraphSage, self).__init__(**kwargs)
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.normalize = normalize
        self.lin_l = Linear(in_channels, out_channels)
        self.lin_r = Linear(in_channels, out_channels)
        self.reset_parameters()

    def reset_parameters(self):
        self.lin_l.reset_parameters()
        self.lin_r.reset_parameters()

    def forward(self, x, edge_index, size=None):
        out = self.propagate(edge_index, x=(x, x), size=size)
        out = self.lin_l(x) + self.lin_r(out)
        if self.normalize:
            out = F.normalize(out, p=2., dim=-1)
        return out

    def message(self, x_j):
        return x_j

    def aggregate(self, inputs, index, dim_size=None):
        return scatter(inputs, index, dim=self.node_dim, dim_size=dim_size, reduce="mean")



class GAT(MessagePassing):

    def __init__(self, in_channels, out_channels, heads = 2,
                 negative_slope = 0.2, dropout = 0., **kwargs):
        super(GAT, self).__init__(node_dim=0, **kwargs)

        self.in_channels = in_channels
        self.out_channels = out_channels
        self.heads = heads
        self.negative_slope = negative_slope
        self.dropout = dropout

        self.lin_l = None
        self.lin_r = None
        self.att_l = None
        self.att_r = None
        
        self.lin_l = Linear(in_channels, out_channels*self.heads)
        self.lin_r = self.lin_l
        self.att_l = Parameter(torch.Tensor(1, self.heads, out_channels))
        self.att_r = Parameter(torch.Tensor(1, self.heads, out_channels))

        self.reset_parameters()

    def reset_parameters(self):
        nn.init.xavier_uniform_(self.lin_l.weight)
        nn.init.xavier_uniform_(self.lin_r.weight)
        nn.init.xavier_uniform_(self.att_l)
        nn.init.xavier_uniform_(self.att_r)

    def forward(self, x, edge_index, size = None):
        H, C = self.heads, self.out_channels
        wh_l = self.lin_l(x).view(-1, H, C)
        wh_r = self.lin_r(x).view(-1, H, C)
        alpha_l = torch.mul(self.att_l, wh_l)
        alpha_r = torch.mul(self.att_r, wh_r)
        out = self.propagate(edge_index,x=(wh_l, wh_r), size=size, alpha=(alpha_l, alpha_r))
        out = out.view(-1, H*C)
        return out


    def message(self, x_j, alpha_j, alpha_i, index, ptr, size_i):
        att = alpha_i + alpha_j
        att = F.leaky_relu(att, negative_slope=self.negative_slope)
        att = softmax(att, ptr if ptr else index)
        att = F.dropout(att, self.dropout)
        out = torch.mul(x_j, att)
        return out


    def aggregate(self, inputs, index, dim_size = None):
        out = scatter(inputs, index = index, dim = self.node_dim, dim_size = dim_size, reduce = "sum")
        return out

class LookRecommender(torch.nn.Module):
    def __init__(self, in_channels, hidden_channels, out_channels, arch='SAGE', heads=2):
        super().__init__()
        self.arch = arch
        
        if arch == 'SAGE':
            self.conv1 = GraphSage(in_channels, hidden_channels, normalize=True)
            self.conv2 = GraphSage(hidden_channels, out_channels, normalize=True)
            
        elif arch == 'GCN':
            self.conv1 = GCNLayer(in_channels, hidden_channels)
            self.conv2 = GCNLayer(hidden_channels, out_channels)
            
        elif arch == 'GAT':
            heads = 2
            hidden_per_head = hidden_channels // heads 
            out_per_head = out_channels // heads

            self.conv1 = GAT(in_channels, hidden_per_head, heads=heads)
            self.conv2 = GAT(hidden_channels, out_per_head, heads=heads)
        else:
            raise ValueError(f"Arquitectura {arch} no soportada")

    def encode(self, x, edge_index):
        x = self.conv1(x, edge_index).relu()
        x = F.dropout(x, p=0.5, training=self.training)
        x = self.conv2(x, edge_index)
        return x

    def decode(self, z, edge_label_index):
        src = z[edge_label_index[0]]
        dst = z[edge_label_index[1]]
        return (src * dst).sum(dim=-1)

@torch.no_grad()
def generate_best_outfits(model, new_item_features, new_item_sublevel, data, node_ids, df_meta, top_k=3):
    model.eval()
    
    if new_item_features.dtype != torch.float:
        new_item_features = new_item_features.float()

    recipes = []
    sub = float(new_item_sublevel)
    
    if sub == 1.1:
        recipes.append({
            'slots': [{'subs': [2.1], 'name': 'Nivel 2.1'}, 
                      {'subs': [2.2, 2.3, 3.1, 3.3], 'name': 'Complemento'}]
        })
        
    elif sub == 1.2:
        recipes.append({
            'slots': [{'subs': [2.3, 3.1], 'name': 'Intermedio'}, 
                      {'subs': [3.2, 3.3], 'name': 'Cierre'}]
        })
        
    else:
        if sub == 2.1:
            recipes.append({
                'slots': [{'subs': [1.1], 'name': 'Principal 1.1'}, 
                          {'subs': [2.2, 2.3, 3.1, 3.3], 'name': 'Complemento'}]
            })
        if sub in [2.2, 2.3, 3.1, 3.3]:
            recipes.append({
                'slots': [{'subs': [1.1], 'name': 'Principal 1.1'}, 
                          {'subs': [2.1], 'name': 'Básico 2.1'}]
            })
        if sub in [2.3, 3.1]:
            recipes.append({
                'slots': [{'subs': [1.2], 'name': 'Principal 1.2'}, 
                          {'subs': [3.2, 3.3], 'name': 'Cierre'}]
            })
        if sub in [3.2, 3.3]:
            recipes.append({
                'slots': [{'subs': [1.2], 'name': 'Principal 1.2'}, 
                          {'subs': [2.3, 3.1], 'name': 'Intermedio'}]
            })

    z_catalog = model.encode(data.x, data.edge_index)
    
    empty_edge = torch.tensor([[],[]], dtype=torch.long)
    z_new = model.conv1(new_item_features, empty_edge).relu()
    z_new = model.conv2(z_new, empty_edge)
    
    all_possible_looks = []
    
    for recipe in recipes:
        candidates_per_slot = []
        possible = True
        
        for slot in recipe['slots']:
            mask = df_meta['sub_nivel'].isin(slot['subs']).values
            valid_indices = np.where(mask)[0]
            valid_tensor_indices = torch.tensor(valid_indices, dtype=torch.long)
            
            if len(valid_tensor_indices) == 0:
                possible = False
                break
                
            z_candidates = z_catalog[valid_tensor_indices]
            scores = (z_new * z_candidates).sum(dim=-1)
            
            k_search = min(top_k * 5, len(scores))
            best_scores, best_idx_local = torch.topk(scores, k=k_search)
            best_idx_global = valid_tensor_indices[best_idx_local]
            
            candidates_per_slot.append(list(zip(best_idx_global.tolist(), best_scores.tolist())))
            
        if possible and candidates_per_slot:
            combinations = list(itertools.product(*candidates_per_slot))
            all_possible_looks.extend(combinations)

    if not all_possible_looks:
        print("No se encontraron looks que cumplan las reglas estrictas.")
        return []

    sorted_global_looks = sorted(all_possible_looks, key=lambda x: x[0][1] + x[1][1], reverse=True)
    
    final_looks = []
    seen = set()
    
    print(f"--- Top {top_k} Outfits Generados (Subnivel Prenda Nueva: {new_item_sublevel}) ---")
    
    for combo in sorted_global_looks:
        if len(final_looks) >= top_k:
            break
            
        idx1, score1 = combo[0]
        idx2, score2 = combo[1]
        
        id1_str = node_ids[idx1]
        id2_str = node_ids[idx2]
        
        if id1_str == id2_str: continue
        
        look_signature = frozenset([id1_str, id2_str])
        if look_signature in seen: continue
        seen.add(look_signature)
        
        sub1 = df_meta.iloc[idx1]['sub_nivel']
        sub2 = df_meta.iloc[idx2]['sub_nivel']
        
        total_score = score1 + score2
        
        print(f"LOOK {len(final_looks)+1} (Score: {total_score:.2f})")
        print(f"   1. [NUEVA] Prenda actual (Nivel: {new_item_sublevel})")
        print(f"   2. {id1_str} (Nivel: {sub1}) - Score: {score1:.2f}")
        print(f"   3. {id2_str} (Nivel: {sub2}) - Score: {score2:.2f}")
        print("-" * 30)
        
        final_looks.append([id1_str, id2_str])
        
    return final_looks