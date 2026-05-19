import React from 'react';
import Editor from '@monaco-editor/react';
import { getLanguage } from '../utils/filePaths';
import { registerSnippetCompletions } from '../utils/editorSnippets';

export function EditorPane({
    activeFilePath,
    activeFileContent,
    dirty,
    onChange,
    onEditorMount,
    onDeleteActive
}) {
    return (
        <section className="editor-panel">
            <div className="tabbar">
                <span className="file-tab">{activeFilePath || 'No file selected'}</span>
                <span className="dirty-mark">{dirty ? 'Unsaved' : ''}</span>
                <button type="button" className="danger" onClick={onDeleteActive}>Delete</button>
            </div>
            <div className="editor-host">
                <Editor
                    value={activeFileContent}
                    language={getLanguage(activeFilePath)}
                    theme="vs-dark"
                    beforeMount={registerSnippetCompletions}
                    onMount={onEditorMount}
                    onChange={(value) => onChange(value || '')}
                    options={{
                        automaticLayout: true,
                        fontSize: 14,
                        lineHeight: 22,
                        minimap: { enabled: true },
                        wordWrap: 'on',
                        tabSize: 4,
                        insertSpaces: true,
                        bracketPairColorization: { enabled: true },
                        guides: { bracketPairs: true, indentation: true },
                        suggestOnTriggerCharacters: true,
                        quickSuggestions: { other: true, comments: false, strings: true },
                        acceptSuggestionOnEnter: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on'
                    }}
                />
            </div>
        </section>
    );
}
