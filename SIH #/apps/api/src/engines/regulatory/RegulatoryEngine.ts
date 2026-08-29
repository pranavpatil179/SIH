import { supabaseAdmin } from '../../lib/supabase';

export class RegulatoryEngine {
  async evaluate(projectData: any) {
    const { data: rules } = await supabaseAdmin
      .from('regulatory_rules')
      .select('*')
      .eq('status', 'active');
      
    if (!rules) return [];

    const applicableRules = [];
    
    for (const rule of rules) {
      let conditionsMet = false;
      const conditions = rule.conditions || [];
      
      const evalCondition = (cond: any) => {
        const val = projectData[cond.field];
        switch(cond.operator) {
          case '=': return val === cond.value;
          case '!=': return val !== cond.value;
          case '>': return val > cond.value;
          case '<': return val < cond.value;
          case '>=': return val >= cond.value;
          case '<=': return val <= cond.value;
          case 'IN': return cond.value.includes(val);
          case 'NOT_IN': return !cond.value.includes(val);
          case 'CONTAINS': return typeof val === 'string' && val.includes(cond.value);
          case 'TRUE': return val === true;
          case 'FALSE': return val === false;
          default: return false;
        }
      };

      if (rule.logic === 'AND') {
        conditionsMet = conditions.every(evalCondition);
      } else if (rule.logic === 'OR') {
        conditionsMet = conditions.some(evalCondition);
      }

      if (conditionsMet) {
        applicableRules.push({
          approval_type: rule.approval_type_id,
          reason: rule.rule_name,
          rule_id: rule.rule_id,
          data_source: rule.data_source,
          source_url: rule.source_url,
          result: rule.result
        });
      }
    }
    
    return applicableRules;
  }
}
