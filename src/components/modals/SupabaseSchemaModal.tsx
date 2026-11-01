import React, { useState, useEffect } from "react";
import {
  Database,
  X,
  Copy,
  Check,
  ShieldCheck,
  Server,
  KeyRound,
  FileCode,
} from "lucide-react";
import { api } from "../../services/api.ts";

interface SupabaseSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSchemaModal: React.FC<SupabaseSchemaModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [sql, setSql] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getSchemaSql()
        .then((res) => setSql(res.sql))
        .catch(() => setSql("-- Schema file could not be loaded."))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">
                Supabase PostgreSQL Schema &amp; RLS Policies
              </h3>
              <p className="text-xs text-gray-500">
                11 tables with Row Level Security (RLS) and automatic user triggers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Security badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>RLS Enabled on All 11 Tables</span>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900 font-semibold">
            <KeyRound className="w-4 h-4 text-[#6C4AB6] shrink-0" />
            <span>Zero-Trust User Data Isolation</span>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900 font-semibold">
            <Server className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Cascade Deletions &amp; Fast Indexes</span>
          </div>
        </div>

        {/* SQL Script Block */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#6C4AB6]" />
              <span>Full SQL Migration File (supabase-schema.sql)</span>
            </span>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-[#6C4AB6] text-[#6C4AB6] hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL Schema</span>
                </>
              )}
            </button>
          </div>

          <div className="relative rounded-2xl bg-gray-900 text-gray-100 p-4 font-mono text-[11px] max-h-72 overflow-y-auto leading-relaxed border border-gray-800">
            <pre className="whitespace-pre-wrap">{sql}</pre>
          </div>
        </div>

        {/* Deployment Guide */}
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 space-y-2">
          <p className="font-bold text-gray-900">How to run in Supabase:</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600 leading-relaxed">
            <li>Log into your Supabase Dashboard and navigate to the <strong>SQL Editor</strong>.</li>
            <li>Paste this SQL snippet and click <strong>Run</strong>.</li>
            <li>All 11 tables, constraints, foreign keys, and RLS policies will be automatically provisioned.</li>
          </ol>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#6C4AB6] text-white text-xs font-bold hover:bg-[#58399e] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
