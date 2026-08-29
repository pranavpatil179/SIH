import { supabaseAdmin } from '../../lib/supabase';

export class DependencyGraphBuilder {
  async buildGraph(approvalTypeIds: string[]) {
    const { data: deps } = await supabaseAdmin
      .from('approval_dependencies')
      .select('*')
      .in('approval_type_id', approvalTypeIds);
      
    const graph: Record<string, string[]> = {};
    approvalTypeIds.forEach(id => graph[id] = []);
    
    if (deps) {
      deps.forEach(d => {
        if (graph[d.approval_type_id]) {
          graph[d.approval_type_id].push(d.depends_on_approval_type_id);
        }
      });
    }
    return graph;
  }

  getExecutionOrder(graph: Record<string, string[]>) {
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (node: string) => {
      if (visited.has(node)) return;
      visited.add(node);
      const deps = graph[node] || [];
      for (const dep of deps) {
        visit(dep);
      }
      order.push(node);
    };
    
    Object.keys(graph).forEach(visit);
    return order;
  }

  getParallelGroups(graph: Record<string, string[]>) {
    return { groups: [Object.keys(graph)] };
  }

  getCriticalPath(graph: Record<string, string[]>) {
    return { path: Object.keys(graph) };
  }
}
