import React, { useState } from 'react';
import { useDashboard } from '../../context/DashboardContext';
import { 
  X, 
  Search, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Calculator,
  Compass
} from 'lucide-react';

export default function GlossaryModal() {
  const { isGlossaryOpen, setIsGlossaryOpen, data } = useDashboard();
  const { glossary } = data;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [expandedTerms, setExpandedTerms] = useState({});

  if (!isGlossaryOpen) return null;

  const toggleTerm = (termName) => {
    setExpandedTerms(prev => ({
      ...prev,
      [termName]: !prev[termName]
    }));
  };

  // Filter terms
  const filteredCategories = glossary.map(cat => {
    if (selectedCategory !== 'ALL' && cat.category !== selectedCategory) {
      return null;
    }
    const matchingTerms = cat.terms.filter(t => 
      t.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.formula && t.formula.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (matchingTerms.length === 0) return null;
    return { ...cat, terms: matchingTerms };
  }).filter(Boolean);

  const totalTermCount = glossary.reduce((acc, c) => acc + c.terms.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-900">
                  Revenue Manager Glossary
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  {totalTermCount} Terms
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Every VARO term, formula, and worked example in one place.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsGlossaryOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by term, formula or keyword (e.g. RevPAR, Wash, Estimator)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Categories ({totalTermCount})</option>
            {glossary.map(c => (
              <option key={c.category} value={c.category}>
                {c.category} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Terms list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No matching terms found for "{searchQuery}".
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.category} className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700">
                    {cat.category}
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {cat.terms.length} terms
                  </span>
                </div>

                <div className="space-y-2.5">
                  {cat.terms.map(item => {
                    const isExpanded = expandedTerms[item.term] ?? true;
                    return (
                      <div 
                        key={item.term}
                        className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:border-indigo-300 transition"
                      >
                        <button
                          onClick={() => toggleTerm(item.term)}
                          className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50/60 transition"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.term}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs space-y-2.5 bg-slate-50/40">
                            {item.formula && (
                              <div className="bg-indigo-50/60 border border-indigo-100 p-2.5 rounded-lg flex items-start space-x-2">
                                <Calculator className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-[10px] font-bold text-indigo-700 uppercase">Formula: </span>
                                  <span className="font-mono text-indigo-900 font-semibold">{item.formula}</span>
                                </div>
                              </div>
                            )}

                            <div>
                              <span className="font-semibold text-slate-700">Definition: </span>
                              <span className="text-slate-600 leading-relaxed">{item.definition}</span>
                            </div>

                            {item.example && (
                              <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                                <span className="font-bold text-slate-800">Worked Example: </span>
                                <span>{item.example}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>AuraStay VARO Revenue Engine v4.2.0</span>
          <button
            onClick={() => setIsGlossaryOpen(false)}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

