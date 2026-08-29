const fs = require('fs');
const path = require('path');

const baseDir = '/Users/pranavpatil/Documents/projects/SIH #/apps/api/src';

const files = {
  'index.ts': `import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';

import projectsRouter from './routes/projects';
import applicationsRouter from './routes/applications';
import documentsRouter from './routes/documents';
import queriesRouter from './routes/queries';
import inspectionsRouter from './routes/inspections';
import notificationsRouter from './routes/notifications';
import officerRouter from './routes/officer';
import schemesRouter from './routes/schemes';
import grievancesRouter from './routes/grievances';
import adminRouter from './routes/admin';
import analyticsRouter from './routes/analytics';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

app.use('/projects', projectsRouter);
app.use('/applications', applicationsRouter);
app.use('/documents', documentsRouter);
app.use('/queries', queriesRouter);
app.use('/inspections', inspectionsRouter);
app.use('/notifications', notificationsRouter);
app.use('/officer', officerRouter);
app.use('/schemes', schemesRouter);
app.use('/grievances', grievancesRouter);
app.use('/admin', adminRouter);
app.use('/analytics', analyticsRouter);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
`,
  'lib/supabase.ts': `import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
`,
  'middleware/auth.ts': `import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name, department_id')
    .eq('id', user.id)
    .single();

  req.user = { id: user.id, email: user.email, ...profile };
  next();
};
`,
  'middleware/roleCheck.ts': `import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): any => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
};
`,
  'middleware/errorHandler.ts': `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};
`,
  'engines/regulatory/RegulatoryEngine.ts': `import { supabaseAdmin } from '../../lib/supabase';

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
`,
  'engines/regulatory/DependencyGraphBuilder.ts': `import { supabaseAdmin } from '../../lib/supabase';

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
`,
  'engines/workflow/WorkflowOrchestrator.ts': `import { supabaseAdmin } from '../../lib/supabase';
import { AuditService } from '../../services/audit/AuditService';

export class WorkflowOrchestrator {
  private audit = new AuditService();

  async initiateWorkflow(applicationId: string) {
    const { data: application } = await supabaseAdmin
      .from('applications')
      .select('*, projects(*)')
      .eq('id', applicationId)
      .single();

    if (!application) throw new Error('Application not found');

    const { data: approvals } = await supabaseAdmin
      .from('application_approvals')
      .select('*')
      .eq('application_id', applicationId);

    if (approvals) {
      for (const approval of approvals) {
        await supabaseAdmin.from('workflow_tasks').insert({
          application_id: applicationId,
          application_approval_id: approval.id,
          department_id: approval.department_id,
          task_type: 'scrutiny',
          status: 'pending'
        });
      }
    }
    
    await supabaseAdmin.from('applications').update({ status: 'under_review' }).eq('id', applicationId);
    await this.audit.log('system', 'APPLICATION_SUBMITTED', 'applications', applicationId);
  }

  async updateTaskStatus(taskId: string, status: string, userId: string) {
    await supabaseAdmin.from('workflow_tasks').update({ status }).eq('id', taskId);
    await this.audit.log(userId, 'STATUS_CHANGED', 'workflow_tasks', taskId, undefined, { status });
  }

  async handleQuery(approvalId: string, question: string, officerId: string) {
    const { data: query } = await supabaseAdmin.from('queries').insert({
      application_approval_id: approvalId,
      raised_by: officerId,
      question
    }).select().single();
    
    await this.audit.log(officerId, 'QUERY_RAISED', 'queries', query.id);
    return query;
  }

  async handleQueryResponse(queryId: string, response: string, responderId: string) {
    const { data: qr } = await supabaseAdmin.from('query_responses').insert({
      query_id: queryId,
      responded_by: responderId,
      response
    }).select().single();
    
    await supabaseAdmin.from('queries').update({ status: 'answered' }).eq('id', queryId);
    await this.audit.log(responderId, 'QUERY_RESPONDED', 'queries', queryId);
    return qr;
  }

  async scheduleInspection(applicationId: string, data: any, officerId: string) {
    const { data: inspection } = await supabaseAdmin.from('inspections').insert({
      application_id: applicationId,
      ...data
    }).select().single();
    await this.audit.log(officerId, 'INSPECTION_SCHEDULED', 'inspections', inspection.id);
    return inspection;
  }

  async completeInspection(inspectionId: string, findings: string, result: string, officerId: string) {
    const { data: inspection } = await supabaseAdmin.from('inspections').update({
      findings, result, status: 'completed', completed_at: new Date().toISOString()
    }).eq('id', inspectionId).select().single();
    await this.audit.log(officerId, 'INSPECTION_COMPLETED', 'inspections', inspectionId);
    return inspection;
  }

  async recordDecision(approvalId: string, decision: string, officerId: string, data: any = {}) {
    const { data: approval } = await supabaseAdmin.from('application_approvals').update({
      status: decision,
      decided_at: new Date().toISOString(),
      decided_by: officerId,
      ...data
    }).eq('id', approvalId).select().single();
    await this.audit.log(officerId, \`APPROVAL_\${decision.toUpperCase()}\`, 'application_approvals', approvalId);
    return approval;
  }
}
`,
  'engines/sla/SLAEngine.ts': `import { supabaseAdmin } from '../../lib/supabase';

export class SLAEngine {
  async calculateSLAStatus(approvalId: string) {
    const { data: approval } = await supabaseAdmin.from('application_approvals').select('*').eq('id', approvalId).single();
    if (!approval) return null;
    
    const now = new Date();
    const due = new Date(approval.sla_due_at);
    const total = due.getTime() - new Date(approval.submitted_at).getTime();
    const elapsed = now.getTime() - new Date(approval.submitted_at).getTime();
    const remaining = due.getTime() - now.getTime();
    
    let status = 'ON_TRACK';
    if (remaining < 0) status = 'BREACHED';
    else if (remaining / total < 0.2) status = 'AT_RISK';
    
    return { status, elapsed, remaining };
  }

  async checkAndEscalate() {
    const { data: approvals } = await supabaseAdmin.from('application_approvals')
      .select('*')
      .in('status', ['under_scrutiny', 'query_raised'])
      .lt('sla_due_at', new Date().toISOString());
      
    if (approvals) {
      for (const a of approvals) {
        await supabaseAdmin.from('escalations').insert({
          application_approval_id: a.id,
          reason: 'SLA Breached',
          level: 1
        });
      }
    }
  }

  async getSLADashboard(departmentId?: string) {
    return { on_track: 10, at_risk: 2, breached: 1 };
  }
}
`,
  'engines/risk/RiskEngine.ts': `export class RiskEngine {
  async assessRisk(projectData: any) {
    let score = 0;
    const factors = [];

    if (projectData.hazardous_materials) {
      score += 20;
      factors.push({ name: 'Hazardous Materials', contribution: 20 });
    }
    if (projectData.pollution_category === 'red') {
      score += 15;
      factors.push({ name: 'Red Category Pollution', contribution: 15 });
    }
    if (projectData.investment_crore > 50) {
      score += 10;
      factors.push({ name: 'High Investment', contribution: 10 });
    }
    if (projectData.employee_count > 500) {
      score += 10;
      factors.push({ name: 'Large Workforce', contribution: 10 });
    }
    if (projectData.manufacturing_process?.toLowerCase().includes('chemical')) {
      score += 15;
      factors.push({ name: 'Chemical Process', contribution: 15 });
    }

    let risk_level = 'LOW';
    if (score >= 30) risk_level = 'MEDIUM';
    if (score >= 50) risk_level = 'HIGH';

    return {
      score,
      risk_level,
      factors,
      data_source: 'AI_ANALYSIS',
      note: 'This is decision support only. Final decision rests with authorized officials.'
    };
  }
}
`,
  'services/gemini/DocumentIntelligence.ts': `import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export class DocumentIntelligence {
  async extractDocument(base64Image: string, mimeType: string, docType?: string) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = \`Extract details from this document. \${docType ? 'It is a ' + docType : ''}. Return structured JSON only: { document_type, company_name, pan, gstin, registration_number, address, issue_date, expiry_date, relevant_fields }\`;
      
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType
          }
        }
      ]);
      const text = result.response.text();
      const match = text.match(/\\{.*\\}/s);
      const json = match ? JSON.parse(match[0]) : {};
      json.data_source = 'AI_ANALYSIS';
      return json;
    } catch (error) {
      console.error(error);
      return { error: 'AI analysis temporarily unavailable' };
    }
  }

  async classifyDocument(base64Image: string, mimeType: string) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const prompt = "What type of document is this? (e.g. PAN Card, GST Certificate, Incorporation Certificate). Return only the type string.";
      const result = await model.generateContent([{ inlineData: { data: base64Image, mimeType } }, prompt]);
      return { type: result.response.text().trim(), data_source: 'AI_ANALYSIS' };
    } catch {
      return { error: 'AI analysis temporarily unavailable' };
    }
  }

  validateExtraction(extracted: any, expectedDocType: string) {
    return { valid: extracted.document_type?.toLowerCase().includes(expectedDocType.toLowerCase()) };
  }
}
`,
  'services/audit/AuditService.ts': `import { supabaseAdmin } from '../../lib/supabase';

export class AuditService {
  async log(actor: string, action: string, entityType: string, entityId: string, detail?: string, oldValue?: any, newValue?: any) {
    await supabaseAdmin.from('audit_log').insert({
      actor,
      action,
      detail: JSON.stringify({ entityType, entityId, detail, oldValue, newValue }),
      created_at: new Date().toISOString()
    });
  }
}
`,
  'services/connectors/ConnectorBase.ts': `export abstract class GovernmentConnector {
  abstract id: string;
  abstract name: string;
  abstract authenticate(): Promise<boolean>;
  abstract healthCheck(): Promise<any>;
}
`,
  'services/connectors/MaitriConnector.ts': `import { GovernmentConnector } from './ConnectorBase';

export class MaitriConnector extends GovernmentConnector {
  id = 'maitri';
  name = 'Maharashtra MAITRI';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
`,
  'services/connectors/NSWSConnector.ts': `import { GovernmentConnector } from './ConnectorBase';

export class NSWSConnector extends GovernmentConnector {
  id = 'nsws';
  name = 'National Single Window System';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
`,
  'services/connectors/DigiLockerConnector.ts': `import { GovernmentConnector } from './ConnectorBase';

export class DigiLockerConnector extends GovernmentConnector {
  id = 'digilocker';
  name = 'DigiLocker';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
`,
  'services/connectors/GSTConnector.ts': `import { GovernmentConnector } from './ConnectorBase';

export class GSTConnector extends GovernmentConnector {
  id = 'gst_nic';
  name = 'GST Verification (NIC)';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
`,
  'services/connectors/UdyamConnector.ts': `import { GovernmentConnector } from './ConnectorBase';

export class UdyamConnector extends GovernmentConnector {
  id = 'udyam';
  name = 'Udyam Registration (MSME)';
  async authenticate() { return false; }
  async healthCheck() {
    return { status: 'unavailable', message: 'Live integration unavailable — credentials/API access required.', lastAttempted: new Date() };
  }
}
`,
  'routes/projects.ts': `import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { RegulatoryEngine } from '../engines/regulatory/RegulatoryEngine';
import { DependencyGraphBuilder } from '../engines/regulatory/DependencyGraphBuilder';
import { RiskEngine } from '../engines/risk/RiskEngine';

const router = Router();
const regEngine = new RegulatoryEngine();
const depBuilder = new DependencyGraphBuilder();
const riskEngine = new RiskEngine();

router.get('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').select('*');
  res.json(data);
});

router.post('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').insert(req.body).select().single();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  res.json(data);
});

router.patch('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('projects').update(req.body).eq('id', req.params.id).select().single();
  res.json(data);
});

router.post('/:id/evaluate-approvals', async (req, res) => {
  const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  if (!project) { res.status(404).json({error:'Not found'}); return; }
  const approvals = await regEngine.evaluate(project);
  res.json(approvals);
});

router.get('/:id/dependency-graph', async (req, res) => {
  const graph = await depBuilder.buildGraph(['factory_license', 'env_clearance']);
  res.json(graph);
});

router.get('/:id/risk', async (req, res) => {
  const { data: project } = await supabaseAdmin.from('projects').select('*').eq('id', req.params.id).single();
  if (!project) { res.status(404).json({error:'Not found'}); return; }
  const risk = await riskEngine.assessRisk(project);
  res.json(risk);
});

router.get('/:id/verified-data', async (req, res) => {
  const { data } = await supabaseAdmin.from('verified_data').select('*');
  res.json(data);
});

router.get('/:id/incentives', async (req, res) => {
  res.json([]);
});

export default router;
`,
  'routes/applications.ts': `import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';
import { SLAEngine } from '../engines/sla/SLAEngine';

const router = Router();
const orchestrator = new WorkflowOrchestrator();
const slaEngine = new SLAEngine();

router.post('/', async (req, res) => {
  const { data } = await supabaseAdmin.from('applications').insert(req.body).select().single();
  res.json(data);
});

router.get('/:id', async (req, res) => {
  const { data } = await supabaseAdmin.from('applications').select('*, application_approvals(*)').eq('id', req.params.id).single();
  res.json(data);
});

router.post('/:id/submit', async (req, res) => {
  try {
    await orchestrator.initiateWorkflow(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/:id/sla', async (req, res) => {
  res.json({ status: 'ON_TRACK' });
});

router.get('/:id/compliance', async (req, res) => {
  const { data } = await supabaseAdmin.from('compliance_obligations').select('*');
  res.json(data);
});

export default router;
`,
  'routes/documents.ts': `import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { DocumentIntelligence } from '../services/gemini/DocumentIntelligence';

const router = Router();
const docIntel = new DocumentIntelligence();

router.post('/', async (req, res) => {
  res.json({ id: 'doc-1' });
});

router.get('/:id/url', async (req, res) => {
  res.json({ url: 'https://example.com/doc.pdf' });
});

router.post('/:id/process', async (req, res) => {
  res.json({ success: true });
});

export default router;
`,
  'routes/queries.ts': `import { Router } from 'express';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';

const router = Router();
const orchestrator = new WorkflowOrchestrator();

router.post('/:approvalId/query', async (req, res) => {
  const q = await orchestrator.handleQuery(req.params.approvalId, req.body.question, req.body.officerId || 'system');
  res.json(q);
});

router.get('/:approvalId/queries', async (req, res) => {
  res.json([]);
});

router.post('/:id/respond', async (req, res) => {
  const r = await orchestrator.handleQueryResponse(req.params.id, req.body.response, req.body.responderId || 'user');
  res.json(r);
});

export default router;
`,
  'routes/inspections.ts': `import { Router } from 'express';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';

const router = Router();
const orchestrator = new WorkflowOrchestrator();

router.get('/:id/inspections', async (req, res) => {
  res.json([]);
});

router.post('/', async (req, res) => {
  const insp = await orchestrator.scheduleInspection(req.body.applicationId, req.body, req.body.officerId || 'system');
  res.json(insp);
});

router.patch('/:id', async (req, res) => {
  if (req.body.status === 'completed') {
    const insp = await orchestrator.completeInspection(req.params.id, req.body.findings, req.body.result, req.body.officerId || 'system');
    res.json(insp);
  } else {
    res.json({ success: true });
  }
});

export default router;
`,
  'routes/notifications.ts': `import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

router.get('/', async (req, res) => {
  res.json([]);
});

router.patch('/:id/read', async (req, res) => {
  await supabaseAdmin.from('notifications').update({ is_read: true }).eq('id', req.params.id);
  res.json({ success: true });
});

router.patch('/read-all', async (req, res) => {
  res.json({ success: true });
});

export default router;
`,
  'routes/officer.ts': `import { Router } from 'express';
import { WorkflowOrchestrator } from '../engines/workflow/WorkflowOrchestrator';
import { RiskEngine } from '../engines/risk/RiskEngine';

const router = Router();
const orchestrator = new WorkflowOrchestrator();
const riskEngine = new RiskEngine();

router.get('/queue', async (req, res) => {
  res.json([]);
});

router.get('/dashboard', async (req, res) => {
  res.json({ pending: 0, at_risk: 0, sla_breached: 0, queries: 0 });
});

router.patch('/approvals/:id/status', async (req, res) => {
  const result = await orchestrator.recordDecision(req.params.id, req.body.status, req.body.officerId || 'system', req.body.data);
  res.json(result);
});

router.post('/approvals/:id/risk-assess', async (req, res) => {
  res.json({ score: 0, level: 'LOW' });
});

export default router;
`,
  'routes/schemes.ts': `import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => res.json([]));
router.get('/projects/:id/schemes', (req, res) => res.json([]));
export default router;
`,
  'routes/grievances.ts': `import { Router } from 'express';
const router = Router();
router.post('/', (req, res) => res.json({ id: 'grievance-1' }));
router.get('/', (req, res) => res.json([]));
export default router;
`,
  'routes/admin.ts': `import { Router } from 'express';
import { MaitriConnector } from '../services/connectors/MaitriConnector';
const router = Router();
router.get('/regulatory-rules', (req, res) => res.json([]));
router.post('/regulatory-rules', (req, res) => res.json({ id: 'rule-1' }));
router.patch('/regulatory-rules/:id', (req, res) => res.json({ success: true }));
router.get('/departments', (req, res) => res.json([]));
router.get('/audit-logs', (req, res) => res.json([]));
router.get('/connectors', (req, res) => res.json([]));
router.post('/connectors/:id/health', async (req, res) => {
  if (req.params.id === 'maitri') {
    const conn = new MaitriConnector();
    return res.json(await conn.healthCheck());
  }
  res.json({ status: 'unknown' });
});
router.get('/analytics', (req, res) => res.json({}));
export default router;
`,
  'routes/analytics.ts': `import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';
const router = Router();
router.get('/dashboard', async (req, res) => {
  res.json({ avg_processing_time_days: 5, sla_compliance_rate: 95, pending_by_department: {} });
});
export default router;
`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

console.log('Files created.');
