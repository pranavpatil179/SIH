import { useState } from 'react';
import { Modal } from './Modal';
import { Search, HelpCircle, BookOpen, Clock, ShieldCheck, Sparkles, CheckCircle2, Building2 } from 'lucide-react';

interface HelpGlossaryModalProps {
  open: boolean;
  onClose: () => void;
}

interface Term {
  term: string;
  fullName: string;
  category: 'approvals' | 'departments' | 'rules' | 'schemes';
  simpleMeaning: string;
  example: string;
  authority?: string;
}

const GLOSSARY_TERMS: Term[] = [
  {
    term: 'NOC',
    fullName: 'No Objection Certificate',
    category: 'approvals',
    simpleMeaning: 'An official certificate stating that a specific government authority has no objection to you setting up or running your business.',
    example: 'Fire NOC confirms your factory has proper fire exits and fire extinguishers.',
  },
  {
    term: 'CTE',
    fullName: 'Consent to Establish',
    category: 'approvals',
    simpleMeaning: 'Permission from the Pollution Control Board to start constructing your factory and installing machinery.',
    example: 'You must get CTE before you start building your manufacturing unit.',
    authority: 'MPCB (Maharashtra Pollution Control Board)',
  },
  {
    term: 'CTO',
    fullName: 'Consent to Operate',
    category: 'approvals',
    simpleMeaning: 'Permission from the Pollution Control Board to begin actual production and run manufacturing machines.',
    example: 'After factory construction is finished and pollution control systems are inspected, you get CTO.',
    authority: 'MPCB',
  },
  {
    term: 'Factory License',
    fullName: 'Factory Act License & Plan Approval',
    category: 'approvals',
    simpleMeaning: 'Legal registration from the Labour Department ensuring worker health, safety, and proper workplace layout.',
    example: 'Required for any factory employing 10+ workers using power or 20+ workers without power.',
    authority: 'DISH (Directorate of Industrial Safety & Health)',
  },
  {
    term: 'SLA',
    fullName: 'Service Level Agreement / RTS Deadline',
    category: 'rules',
    simpleMeaning: 'The maximum legal number of working days a government department is allowed to take to review and issue your approval under the Right to Services Act.',
    example: 'If an approval has a 30-day SLA, the officer must review or approve it within 30 working days.',
  },
  {
    term: 'MPCB',
    fullName: 'Maharashtra Pollution Control Board',
    category: 'departments',
    simpleMeaning: 'The state agency responsible for environmental safety, industrial wastewater, emissions, and hazardous waste management.',
    example: 'They classify your unit into Red (High pollution), Orange, Green, or White (Zero pollution).',
  },
  {
    term: 'DISH',
    fullName: 'Directorate of Industrial Safety and Health',
    category: 'departments',
    simpleMeaning: 'The Maharashtra Labour Department wing that verifies factory structural safety, machine guards, and worker welfare standards.',
    example: 'They approve your factory building drawings and issue the Factory License.',
  },
  {
    term: 'MIDC',
    fullName: 'Maharashtra Industrial Development Corporation',
    category: 'departments',
    simpleMeaning: 'The state corporation that provides industrial land, plots, water, and road infrastructure in industrial parks.',
    example: 'MIDC Chakan, MIDC Butibori, MIDC Ranjangaon are designated industrial zones.',
  },
  {
    term: 'PSI 2019',
    fullName: 'Package Scheme of Incentives 2019',
    category: 'schemes',
    simpleMeaning: 'Government financial subsidy policy offering power tariff concessions, stamp duty exemptions, and GST subsidies for setting up factories in Maharashtra.',
    example: 'Eligible MSMEs can get up to 50% to 100% reimbursement of fixed capital investment.',
  },
  {
    term: 'Parallel Clearances',
    fullName: 'Simultaneous Multi-Department Processing',
    category: 'rules',
    simpleMeaning: 'Instead of applying to one office and waiting for months, BizClear submits your application to Fire, MPCB, Labour, and Power all at the exact same time.',
    example: 'Reduces total clearance time from 9 months down to under 30-45 days.',
  },
  {
    term: 'Document Vault',
    fullName: 'Single-Upload Reusable Document Locker',
    category: 'rules',
    simpleMeaning: 'A digital locker where you upload documents (like PAN, Land Papers, Layout Plans) once, and BizClear reuses them for all government forms automatically.',
    example: 'You do not have to upload your PAN card 5 different times for 5 different departments.',
  },
];

const FAQS = [
  {
    q: 'Do I need to visit government offices physically?',
    a: 'No! BizClear is a 100% digital single-window portal. Your applications, document verifications, fee payments, and queries are handled completely online.',
  },
  {
    q: 'How does AI help me in BizClear?',
    a: 'Gemini AI automatically reads your uploaded documents, checks for missing dates or name mismatches before you submit, and maps exactly which approvals apply to your industry.',
  },
  {
    q: 'What happens if a government officer needs more information?',
    a: 'The officer raises a "Department Query" directly on your dashboard. You will receive an instant notification and can reply with clarifying documents online.',
  },
  {
    q: 'What if an officer delays my application?',
    a: 'Under the Maharashtra Right to Public Services Act, applications past their SLA deadline automatically escalate to senior supervisory officers for priority clearance.',
  },
];

export function HelpGlossaryModal({ open, onClose }: HelpGlossaryModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'terms' | 'faq'>('terms');

  const filteredTerms = GLOSSARY_TERMS.filter((t) => {
    const matchesSearch =
      t.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.simpleMeaning.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <Modal open={open} onClose={onClose} title="💡 Beginner Guide & Jargon Buster" className="max-w-2xl">
      <div className="space-y-4">
        {/* Sub-header intro */}
        <p className="text-xs text-slate-600">
          New to business approvals in Maharashtra? Here are simple, plain-English explanations of common terms and government rules.
        </p>

        {/* Tab switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'terms' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Plain-English Terms ({GLOSSARY_TERMS.length})
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'faq' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" /> Frequently Asked Questions
          </button>
        </div>

        {activeTab === 'terms' ? (
          <>
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search term (e.g. NOC, CTE, SLA, DISH)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/60"
                />
              </div>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'approvals', label: 'Approvals' },
                  { id: 'departments', label: 'Agencies' },
                  { id: 'rules', label: 'Rules' },
                  { id: 'schemes', label: 'Subsidies' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {filteredTerms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No terms found matching "{searchTerm}"
                </div>
              ) : (
                filteredTerms.map((item) => (
                  <div
                    key={item.term}
                    className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-blue-300 hover:bg-blue-50/20 transition-all space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#002046] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {item.term}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{item.fullName}</span>
                      </div>
                      {item.authority && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {item.authority}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {item.simpleMeaning}
                    </p>
                    <p className="text-[11px] text-blue-900 bg-blue-50/60 p-2 rounded-lg border border-blue-100/60">
                      💡 <strong>Example:</strong> {item.example}
                    </p>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          /* FAQ Section */
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <h4 className="text-xs font-bold text-[#002046] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                    Q
                  </span>
                  {faq.q}
                </h4>
                <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            BizClear Maharashtra Beginner Help
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </Modal>
  );
}
