import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ExternalLink, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, MinusCircle } from 'lucide-react';
import { STATUS_COLORS } from '../data/pcrRules';

export default function RuleAccordion({
  rules = [],
  highlightedBoxId,
  onRuleSelect
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [expandedRules, setExpandedRules] = useState({});

  // Filter calculations
  const totalCount = rules.length;
  const passCount = rules.filter(r => r.status === 'PASS').length;
  const failCount = rules.filter(r => r.status === 'FAILED').length;
  const reviewCount = rules.filter(r => r.status === 'NEEDS REVIEW').length;
  const exemptCount = rules.filter(r => r.status === 'EXEMPT').length;
  const naCount = rules.filter(r => r.status === 'NOT APPLICABLE').length;

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.ruleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (rule.observed && rule.observed.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'PASS') return matchesSearch && rule.status === 'PASS';
    if (filterStatus === 'FAIL') return matchesSearch && rule.status === 'FAILED';
    if (filterStatus === 'REVIEW') return matchesSearch && rule.status === 'NEEDS REVIEW';
    if (filterStatus === 'EXEMPT') return matchesSearch && rule.status === 'EXEMPT';
    if (filterStatus === 'NA') return matchesSearch && rule.status === 'NOT APPLICABLE';
    return matchesSearch;
  });

  const toggleExpand = (id) => {
    setExpandedRules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all = {};
    rules.forEach(r => { all[r.id] = true; });
    setExpandedRules(all);
  };

  const collapseAll = () => {
    setExpandedRules({});
  };

  const getStatusBadge = (status) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS["NOT APPLICABLE"];
    let Icon = MinusCircle;
    if (status === 'PASS') Icon = CheckCircle2;
    if (status === 'NEEDS REVIEW') Icon = AlertTriangle;
    if (status === 'FAILED') Icon = XCircle;

    return (
      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${config.badge}`}>
        <Icon className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Controls & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={expandAll}
            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
          >
            Expand all
          </button>
          <span className="text-slate-300">/</span>
          <button
            onClick={collapseAll}
            className="text-slate-600 hover:text-slate-800 hover:underline"
          >
            Collapse
          </button>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search rules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white text-slate-700"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({totalCount})
        </button>
        <button
          onClick={() => setFilterStatus('PASS')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'PASS'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          Pass ({passCount})
        </button>
        <button
          onClick={() => setFilterStatus('FAIL')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'FAIL'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
          }`}
        >
          Fail ({failCount})
        </button>
        <button
          onClick={() => setFilterStatus('REVIEW')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'REVIEW'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          Review ({reviewCount})
        </button>
        <button
          onClick={() => setFilterStatus('EXEMPT')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'EXEMPT'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          Exempt ({exemptCount})
        </button>
        <button
          onClick={() => setFilterStatus('NA')}
          className={`px-3 py-1 rounded font-medium transition ${
            filterStatus === 'NA'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          N/A ({naCount})
        </button>
      </div>

      {/* Accordion Rule List */}
      <div className="space-y-2 mt-2">
        {filteredRules.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 bg-white border border-slate-200 rounded-lg">
            No compliance rules found matching current filter.
          </div>
        ) : (
          filteredRules.map((rule) => {
            const isExpanded = !!expandedRules[rule.id];
            const hasEvidenceBox = !!rule.evidenceBoxId;
            const isEvidenceSelected = highlightedBoxId === rule.evidenceBoxId;

            return (
              <div
                key={rule.id}
                className={`bg-white border rounded-lg transition overflow-hidden ${
                  isEvidenceSelected
                    ? 'border-amber-400 ring-1 ring-amber-300 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(rule.id)}
                  className="p-3 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center space-x-3 truncate pr-2">
                    <span className="font-bold text-xs text-slate-900 shrink-0 min-w-[70px]">
                      {rule.ruleNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {rule.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {getStatusBadge(rule.status)}
                    <span className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 text-xs border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div>
                      <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider text-slate-400">
                        Statutory Mandate
                      </span>
                      <p className="text-slate-700 text-xs mt-0.5 leading-relaxed">
                        {rule.statutoryMandate}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Observed Declaration
                        </span>
                        <div className="mt-1 font-mono text-xs text-slate-800 font-medium">
                          {rule.observed || '—'}
                        </div>
                      </div>

                      <div className="bg-white p-2.5 rounded border border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Analysis & Statutory Basis
                        </span>
                        <p className="mt-1 text-xs text-slate-700 leading-snug">
                          {rule.analysis || rule.legalBasis}
                        </p>
                      </div>
                    </div>

                    {hasEvidenceBox && (
                      <div className="pt-1 flex items-center justify-between">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRuleSelect && onRuleSelect(rule.evidenceBoxId);
                          }}
                          className="flex items-center space-x-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Highlight Evidence Region on Package</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
