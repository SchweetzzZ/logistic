'use client';

import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { customersService } from '@/src/services/customers';
import type { CustomerImportResult } from '@/src/types';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CustomerImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomerImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [estimatedLines, setEstimatedLines] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CustomerImportResult | null>(null);

  if (!isOpen) return null;

  // Processa o arquivo selecionado e calcula contagem estimada de linhas
  const processSelectedFile = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setErrorMessage('Por favor, selecione um arquivo válido no formato CSV (.csv).');
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const lines = text
        .split(/\r\n|\n|\r/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      setEstimatedLines(Math.max(0, lines.length - 1));
    };
    reader.readAsText(selectedFile.slice(0, 1024 * 512));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  // Faz download do arquivo de modelo padrão com separador ponto e vírgula
  const handleDownloadTemplate = () => {
    const header = 'nome;cpf;email;telefone;cep;rua;numero;complemento;cidade;estado\r\n';
    const row1 = 'Maria Silva Santos;12345678901;maria.silva@exemplo.com;11987654321;01310100;Avenida Paulista;1000;Apto 42;São Paulo;SP\r\n';
    const row2 = 'João Pereira Lima;98765432100;joao.pereira@exemplo.com;21998765432;20040002;Avenida Rio Branco;156;Sala 801;Rio de Janeiro;RJ\r\n';
    const content = '\uFEFF' + header + row1 + row2;

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_clientes.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Envia o arquivo CSV para o endpoint backend de importação
  const handleImport = async () => {
    if (!file) {
      setErrorMessage('Selecione um arquivo CSV antes de continuar.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await customersService.importCsv(file);

      if (res.error) {
        setErrorMessage(res.error);
        return;
      }

      if (res.data) {
        setResult(res.data);
        if (res.data.totalImported > 0) {
          onSuccess();
        }
      }
    } catch {
      setErrorMessage('Ocorreu um erro ao processar o arquivo. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setEstimatedLines(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-zinc-900/10">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 ring-1 ring-amber-200/60">
              <Upload className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-950">
                Importar Clientes em Massa
              </h2>
              <p className="text-xs text-zinc-500">
                Faça upload de uma planilha CSV para cadastrar múltiplos clientes de uma só vez.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Resumo do resultado da importação */}
        {result && (
          <div className="mt-4 space-y-3">
            <div
              className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-xs ${
                result.totalImported > 0
                  ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
                  : 'border-amber-200 bg-amber-50/80 text-amber-800'
              }`}
            >
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-semibold">
                  Importação concluída: {result.totalImported} de {result.totalProcessed} cliente(s) importado(s) com sucesso.
                </p>
                {result.errors.length > 0 && (
                  <p className="mt-1 text-zinc-600">
                    {result.errors.length} linha(s) não foram importadas por apresentarem inconsistências.
                  </p>
                )}
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-3.5">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-red-700">
                  <AlertCircle className="size-4 text-red-600" />
                  <span>Linhas com inconsistência ({result.errors.length}):</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-xs text-red-600">
                  {result.errors.map((err, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-2.5 py-1.5 border border-red-100"
                    >
                      <span className="font-mono font-semibold text-zinc-700">
                        Linha {err.row}
                      </span>
                      <span className="text-zinc-600">{err.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Área de Dropzone e Seleção de Arquivo */}
        {!result && (
          <div className="mt-5 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition cursor-pointer ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/40'
                  : file
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-zinc-200 bg-zinc-50/60 hover:border-zinc-300 hover:bg-zinc-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-2">
                    <FileText className="size-6" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-900 break-all">
                    {file.name}
                  </span>
                  <span className="text-xs text-zinc-500 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB
                    {estimatedLines !== null && ` • ~${estimatedLines} cliente(s) detectado(s)`}
                  </span>
                  <span className="mt-2 text-xs font-medium text-amber-600 hover:underline">
                    Clique para escolher outro arquivo
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 mb-2">
                    <Upload className="size-6" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">
                    Arraste seu arquivo CSV aqui ou clique para buscar
                  </span>
                  <span className="text-xs text-zinc-500 mt-1">
                    Suporta delimitador vírgula (,) e ponto e vírgula (;)
                  </span>
                </div>
              )}
            </div>

            {/* Informações sobre o modelo e download */}
            <div className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-zinc-400" />
                <span>Precisa do formato correto das colunas?</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadTemplate();
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
              >
                <Download className="size-3.5" />
                <span>Baixar modelo (.csv)</span>
              </button>
            </div>
          </div>
        )}

        {/* Rodapé com botões de ação */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
          >
            {result ? 'Fechar' : 'Cancelar'}
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleImport}
              disabled={!file || isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin text-amber-400" />
                  <span>Importando...</span>
                </>
              ) : (
                <>
                  <Upload className="size-4 text-amber-400" />
                  <span>Importar Clientes</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 cursor-pointer"
            >
              <Upload className="size-4 text-amber-400" />
              <span>Importar outro arquivo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
