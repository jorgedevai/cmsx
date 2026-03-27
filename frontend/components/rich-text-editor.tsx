'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ImageIcon,
  Quote,
  Code,
  Table as TableIcon,
  Minus,
  Sparkles,
  X,
  Check,
  Loader2,
  Upload,
  Globe,
  Highlighter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import api from '@/lib/api'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const API_BASE =
  process.env.NEXT_PUBLIC_ASSET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ||
  'http://localhost:8080'

function assetUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50',
        active && 'bg-accent text-accent-foreground'
      )}
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="mx-1 h-6 w-px shrink-0 bg-border" />
}

// ---------------------------------------------------------------------------
// Image picker dialog
// ---------------------------------------------------------------------------

function ImagePickerDialog({
  open,
  onClose,
  onInsert,
}: {
  open: boolean
  onClose: () => void
  onInsert: (url: string) => void
}) {
  const [tab, setTab] = useState<'upload' | 'url'>('upload')
  const [uploading, setUploading] = useState(false)
  const [urlValue, setUrlValue] = useState('')

  function handleInsertUrl() {
    if (!urlValue.trim()) return
    onInsert(urlValue.trim())
    setUrlValue('')
    onClose()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const response = await api.post('/assets', formData, {
        headers: { 'Content-Type': undefined },
      })
      const path = response.data.path as string
      onInsert(assetUrl(path))
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === 'upload'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Upload className="h-4 w-4" />
            Upload
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === 'url'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Globe className="h-4 w-4" />
            URL
          </button>
        </div>

        {/* Tab content */}
        <div className="py-2">
          {tab === 'upload' ? (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                      <p className="mb-1 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span>{' '}
                        or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF, WebP, SVG
                      </p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="https://example.com/image.png"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleInsertUrl()}
              />
              <div className="flex justify-end">
                <Button type="button" onClick={handleInsertUrl} disabled={!urlValue.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  Insert
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Link popover
// ---------------------------------------------------------------------------

function LinkPopover({
  open,
  onClose,
  onSubmit,
  initialUrl,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (url: string) => void
  initialUrl: string
}) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setUrl(initialUrl)
  }, [initialUrl])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="absolute left-0 top-full z-50 mt-1 flex items-center gap-2 rounded-md border bg-popover p-2 shadow-md">
      <Input
        ref={inputRef}
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onSubmit(url)
          }
          if (e.key === 'Escape') onClose()
        }}
        className="h-8 w-64 text-sm"
      />
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={() => onSubmit(url)}
        title="Apply link"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        size="icon-xs"
        variant="ghost"
        onClick={onClose}
        title="Cancel"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
}: RichTextEditorProps) {
  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false)
  const [aiBarOpen, setAiBarOpen] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // Token is now handled by server-side proxy via httpOnly cookies
  const aiInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-md max-w-full h-auto',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-border p-2 min-w-[80px]',
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            'border border-border p-2 bg-muted font-semibold text-left min-w-[80px]',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none',
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5',
        },
      }),
      TextStyle,
    ],
    immediatelyRender: false,
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[200px] px-4 py-3',
      },
    },
  })

  // Sync external value changes into the editor (avoid loop by checking content)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // ---- Link ----
  const handleLinkToggle = useCallback(() => {
    if (!editor) return
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run()
      setLinkPopoverOpen(false)
    } else {
      setLinkPopoverOpen(true)
    }
  }, [editor])

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return
      if (!url) {
        editor.chain().focus().unsetLink().run()
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url })
          .run()
      }
      setLinkPopoverOpen(false)
    },
    [editor]
  )

  // ---- Image ----
  const handleImageInsert = useCallback(
    (url: string) => {
      if (!editor) return
      editor.chain().focus().setImage({ src: url }).run()
    },
    [editor]
  )

  // ---- Table ----
  const handleInsertTable = useCallback(() => {
    if (!editor) return
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  // ---- AI Agents ----
  const AI_AGENTS = [
    { id: 'write', label: 'Write content', icon: '✍️', placeholder: 'Describe what to write...' },
    { id: 'expand', label: 'Expand selection', icon: '📖', placeholder: 'How to expand? (or leave empty)' },
    { id: 'summarize', label: 'Summarize', icon: '📋', placeholder: 'Summarize the current content' },
    { id: 'rewrite', label: 'Improve/Rewrite', icon: '🔄', placeholder: 'How to improve? (or leave empty)' },
    { id: 'translate', label: 'Translate', icon: '🌐', placeholder: 'Target language (e.g., English, Spanish)' },
  ] as const

  type AgentId = typeof AI_AGENTS[number]['id']
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('write')
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)

  const buildAgentPrompt = useCallback((agentId: AgentId, userPrompt: string, existingContent: string) => {
    const selected = editor?.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    ) || ''

    switch (agentId) {
      case 'write':
        return {
          prompt: userPrompt,
          context: existingContent
            ? `The editor already has this content (do NOT repeat it, just add new content after it):\n\n${existingContent}`
            : undefined,
        }
      case 'expand':
        return {
          prompt: `Expand the following text with more detail and depth${userPrompt ? '. Additional instructions: ' + userPrompt : ''}:\n\n${selected || existingContent}`,
          context: 'Expand the given text. Keep the same tone and style. Add 1-2 more paragraphs of substance. Output HTML only.',
        }
      case 'summarize':
        return {
          prompt: `Summarize the following content into a concise version (2-3 sentences max):\n\n${selected || existingContent}`,
          context: 'Create a brief, clear summary. Output HTML only (use <p> tags).',
        }
      case 'rewrite':
        return {
          prompt: `Rewrite and improve the following text${userPrompt ? '. Instructions: ' + userPrompt : ' to be clearer and more engaging'}:\n\n${selected || existingContent}`,
          context: 'Rewrite the given text to be better. Keep the same meaning but improve clarity, flow, and impact. Output HTML only.',
        }
      case 'translate':
        return {
          prompt: `Translate the following text to ${userPrompt || 'English'}:\n\n${selected || existingContent}`,
          context: 'Translate accurately while maintaining the original tone and formatting. Output HTML only.',
        }
    }
  }, [editor])

  const handleAiGenerate = useCallback(async () => {
    if (!editor) return
    if (selectedAgent === 'write' && !aiPrompt.trim()) return
    if ((selectedAgent === 'summarize' || selectedAgent === 'rewrite' || selectedAgent === 'expand') && !editor.getText().trim()) {
      toast.error('Editor is empty — nothing to process')
      return
    }
    if (selectedAgent === 'translate' && !aiPrompt.trim()) {
      toast.error('Please specify the target language')
      return
    }

    setAiLoading(true)

    try {
      const { prompt, context } = buildAgentPrompt(selectedAgent, aiPrompt, editor.getText().trim())

      const response = await api.post('/ai/generate', { prompt, context })
      const html = response.data.text || ''

      if (!html.trim()) {
        toast.error('AI returned empty content')
        return
      }

      // Insert based on agent type
      if (selectedAgent === 'rewrite' || selectedAgent === 'summarize' || selectedAgent === 'translate') {
        // Replace: if there's a selection replace it, otherwise replace all
        const hasSelection = editor.state.selection.from !== editor.state.selection.to
        if (hasSelection) {
          editor.chain().focus().deleteSelection().insertContent(html).run()
        } else {
          editor.commands.setContent(html, { emitUpdate: false })
        }
      } else {
        // Write / Expand: append at cursor or end
        editor.chain().focus().insertContent(html).run()
      }

      onChange(editor.getHTML())
      setAiPrompt('')
      setAiBarOpen(false)
      setAgentMenuOpen(false)
      toast.success('Content generated')
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : 'AI generation failed')
    } finally {
      setAiLoading(false)
    }
  }, [editor, aiPrompt, onChange, selectedAgent, buildAgentPrompt])

  // Focus the AI input when bar opens
  useEffect(() => {
    if (aiBarOpen) {
      setTimeout(() => aiInputRef.current?.focus(), 50)
    }
  }, [aiBarOpen])

  // SSR guard
  if (!editor) {
    return (
      <div className="rounded-md border border-input bg-transparent">
        <div className="flex items-center gap-1 border-b p-2">
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
          <div className="h-7 w-7 rounded bg-muted animate-pulse" />
        </div>
        <div className="min-h-[200px] px-4 py-3">
          <div className="h-4 w-3/4 rounded bg-muted animate-pulse mb-2" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  const iconSize = 'h-4 w-4'

  return (
    <div className="rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1.5 rounded-t-md">
        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title="Highlight"
        >
          <Highlighter className={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Headings */}
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          active={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          active={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          active={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered List"
        >
          <ListOrdered className={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Alignment */}
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* Insert group */}
        <div className="relative">
          <ToolbarButton
            onClick={handleLinkToggle}
            active={editor.isActive('link')}
            title="Insert Link"
          >
            <LinkIcon className={iconSize} />
          </ToolbarButton>
          <LinkPopover
            open={linkPopoverOpen}
            onClose={() => setLinkPopoverOpen(false)}
            onSubmit={handleLinkSubmit}
            initialUrl={editor.getAttributes('link').href || ''}
          />
        </div>
        <ToolbarButton
          onClick={() => setImageDialogOpen(true)}
          title="Insert Image"
        >
          <ImageIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive('codeBlock')}
          title="Code Block"
        >
          <Code className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={handleInsertTable}
          title="Insert Table (3x3)"
        >
          <TableIcon className={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          <Minus className={iconSize} />
        </ToolbarButton>

        <ToolbarSeparator />

        {/* AI Generate */}
        <ToolbarButton
          onClick={() => setAiBarOpen(!aiBarOpen)}
          active={aiBarOpen}
          title="AI Generate"
        >
          <Sparkles className={cn(iconSize, 'text-indigo-500')} />
        </ToolbarButton>
      </div>

      {/* AI agent bar */}
      {aiBarOpen && (
        <div className="border-b bg-indigo-50/50 dark:bg-indigo-950/20 px-3 py-2 space-y-2">
          {/* Agent selector */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground mr-1">AI Agent:</span>
            {AI_AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedAgent(agent.id)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                  selectedAgent === agent.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-background border text-muted-foreground hover:bg-accent'
                )}
              >
                <span>{agent.icon}</span>
                {agent.label}
              </button>
            ))}
          </div>
          {/* Prompt input + actions */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500 shrink-0" />
            <Input
              ref={aiInputRef}
              placeholder={AI_AGENTS.find(a => a.id === selectedAgent)?.placeholder || 'Describe...'}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAiGenerate()
                }
                if (e.key === 'Escape') {
                  setAiBarOpen(false)
                  setAiPrompt('')
                }
              }}
              disabled={aiLoading}
              className="h-8 text-sm border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500/50"
            />
            {aiLoading ? (
              <Button
                size="sm"
                type="button"
                variant="destructive"
                onClick={() => setAiLoading(false)}
                className="shrink-0 h-8"
              >
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                Wait...
              </Button>
            ) : (
              <Button
                size="sm"
                type="button"
                onClick={handleAiGenerate}
                disabled={selectedAgent === 'write' && !aiPrompt.trim()}
                className="shrink-0 h-8 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                Generate
              </Button>
            )}
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setAiBarOpen(false)
                setAiPrompt('')
              }}
              title="Close AI bar"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor content area */}
      <EditorContent editor={editor} />

      {/* Image picker dialog */}
      <ImagePickerDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={handleImageInsert}
      />
    </div>
  )
}
