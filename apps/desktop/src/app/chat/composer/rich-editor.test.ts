// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'

import { insertInlineRefsIntoEditor } from './inline-refs'
import {
  composerPlainText,
  normalizeComposerEditorDom,
  refChipElement,
  renderComposerContents,
  RICH_INPUT_SLOT
} from './rich-editor'

describe('renderComposerContents', () => {
  it('renders all text as plain text without interpreting user text as HTML', () => {
    const editor = document.createElement('div')
    editor.dataset.slot = RICH_INPUT_SLOT

    renderComposerContents(editor, '@file:`<img src=x onerror=alert(1)>` <b>raw</b>')

    // No HTML interpretation — everything is escaped as text
    expect(editor.querySelector('img')).toBeNull()
    expect(editor.querySelector('b')).toBeNull()
    // No chip elements created for @refs — chips are popover-only
    expect(editor.querySelector('[data-ref-kind]')).toBeNull()
    expect(editor.textContent).toContain('@file:`<img src=x onerror=alert(1)>`')
    expect(editor.textContent).toContain('<b>raw</b>')
    // Round-trip serialization preserves the original text
    expect(composerPlainText(editor)).toBe('@file:`<img src=x onerror=alert(1)>` <b>raw</b>')
  })

  it('renders newlines as <br> elements', () => {
    const editor = document.createElement('div')
    editor.dataset.slot = RICH_INPUT_SLOT

    renderComposerContents(editor, 'line1\nline2\n\nline3')

    expect(editor.querySelectorAll('br').length).toBe(3)
    expect(composerPlainText(editor)).toBe('line1\nline2\n\nline3')
  })
})

describe('normalizeComposerEditorDom', () => {
  it('unwraps a single insertHTML wrapper div so plain text stays one line', () => {
    const editor = document.createElement('div')
    editor.dataset.slot = RICH_INPUT_SLOT
    editor.innerHTML = '<div><span data-ref-text="@file:`src/foo.ts`" contenteditable="false">foo.ts</span> </div>'

    normalizeComposerEditorDom(editor)

    expect(composerPlainText(editor)).toBe('@file:`src/foo.ts` ')
    expect(editor.querySelector(':scope > div')).toBeNull()
  })

  it('removes a trailing br after a ref chip', () => {
    const editor = document.createElement('div')
    editor.dataset.slot = RICH_INPUT_SLOT
    editor.append(refChipElement('file', '`src/foo.ts`'), document.createElement('br'))

    normalizeComposerEditorDom(editor)

    expect(composerPlainText(editor)).toBe('@file:`src/foo.ts`')
    expect(editor.querySelector('br')).toBeNull()
  })
})

describe('insertInlineRefsIntoEditor', () => {
  it('inserts chips without wrapper divs or spurious newlines', () => {
    const editor = document.createElement('div')
    editor.dataset.slot = RICH_INPUT_SLOT

    insertInlineRefsIntoEditor(editor, ['@file:`src/foo.ts`'])

    expect(editor.querySelector(':scope > div')).toBeNull()
    expect(composerPlainText(editor)).toBe('@file:`src/foo.ts` ')
  })
})
