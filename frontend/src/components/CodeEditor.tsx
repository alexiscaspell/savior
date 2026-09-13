import Editor, { type OnMount } from '@monaco-editor/react'
import type { editor, Position } from 'monaco-editor'
import { Box, FormHelperText, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import { usePrefs } from '../i18n/PrefsContext'

type CodeLanguage = 'json' | 'python' | 'javascript'

export default function CodeEditor({
  label,
  value,
  onChange,
  language = 'json',
  height = 180,
  error,
  helperText,
  /** Unique model path; used to attach a JSON schema when provided */
  path,
  schema,
  /** Extra completion suggestions (e.g. $response) */
  completions = [],
}: {
  label: string
  value: string
  onChange: (value: string) => void
  language?: CodeLanguage
  height?: number
  error?: boolean
  helperText?: string
  path?: string
  schema?: object
  completions?: string[]
}) {
  const { mode } = usePrefs()
  const isDark = mode === 'dark'
  const modelPath = path || `inmemory://model/${language}-${label}`
  const completionsRef = useRef(completions)
  const disposableRef = useRef<{ dispose: () => void } | null>(null)

  useEffect(() => {
    completionsRef.current = completions
  }, [completions])

  useEffect(() => {
    return () => {
      disposableRef.current?.dispose()
      disposableRef.current = null
    }
  }, [])

  const handleMount: OnMount = (_editor, monaco) => {
    if (language === 'json') {
      const existing = monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas || []
      const uri = `${modelPath}.schema.json`
      const others = existing.filter(
        (s: { uri: string; fileMatch?: string[] }) =>
          s.uri !== uri && !(s.fileMatch || []).includes(modelPath),
      )

      monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
        validate: true,
        allowComments: false,
        schemas: schema
          ? [
              ...others,
              {
                uri,
                fileMatch: [modelPath],
                schema,
              },
            ]
          : others,
      })
    }

    disposableRef.current?.dispose()
    disposableRef.current = monaco.languages.registerCompletionItemProvider(language, {
      triggerCharacters: ['$', '.', '_'],
      provideCompletionItems: (model: editor.ITextModel, position: Position) => {
        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }
        const suggestions = completionsRef.current.map((labelText) => ({
          label: labelText,
          kind: monaco.languages.CompletionItemKind.Variable,
          insertText: labelText,
          range,
          detail: 'SAVIOR variable',
        }))
        return { suggestions }
      },
    })
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Box
        sx={{
          border: 1,
          borderColor: error ? 'error.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: isDark ? '#0D1615' : '#F8FFFE',
          transition: 'border-color 0.2s',
          '&:focus-within': {
            borderColor: error ? 'error.main' : 'primary.main',
            boxShadow: (t) =>
              `0 0 0 2px ${error ? t.palette.error.main : t.palette.primary.main}33`,
          },
        }}
      >
        <Editor
          height={height}
          language={language}
          theme={isDark ? 'vs-dark' : 'light'}
          value={value}
          path={modelPath}
          onChange={(v) => onChange(v ?? '')}
          onMount={handleMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 8, bottom: 8 },
            renderLineHighlight: 'line',
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
          loading={
            <Box sx={{ p: 2, color: 'text.secondary', fontSize: 13 }}>Loading editor…</Box>
          }
        />
      </Box>
      {(helperText || error) && (
        <FormHelperText error={error} sx={{ mx: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  )
}
