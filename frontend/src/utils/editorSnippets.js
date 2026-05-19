const snippetCompletions = [
    { label: 'console.log', detail: 'print value', languages: ['javascript', 'typescript'], insert: 'console.log($0);' },
    { label: 'console.error', detail: 'print error', languages: ['javascript', 'typescript'], insert: 'console.error($0);' },
    { label: 'function', detail: 'function block', languages: ['javascript', 'typescript'], insert: 'function $0() {\n    \n}' },
    { label: 'async function', detail: 'async block', languages: ['javascript', 'typescript'], insert: 'async function $0() {\n    \n}' },
    { label: 'const', detail: 'constant', languages: ['javascript', 'typescript'], insert: 'const $0 = ;' },
    { label: 'try/catch', detail: 'error block', languages: ['javascript', 'typescript'], insert: 'try {\n    $0\n} catch (error) {\n    console.error(error);\n}' },
    { label: 'document.querySelector', detail: 'select element', languages: ['javascript', 'typescript'], insert: 'document.querySelector("$0")' },
    { label: 'print', detail: 'python output', languages: ['python'], insert: 'print($0)' },
    { label: 'def', detail: 'python function', languages: ['python'], insert: 'def $0():\n    pass' },
    { label: 'div', detail: 'html element', languages: ['html'], insert: '<div>$0</div>' }
];

let snippetsRegistered = false;

export function registerSnippetCompletions(monaco) {
    if (snippetsRegistered) return;
    snippetsRegistered = true;

    ['javascript', 'typescript', 'python', 'html'].forEach((language) => {
        monaco.languages.registerCompletionItemProvider(language, {
            provideCompletionItems(model, position) {
                const word = model.getWordUntilPosition(position);
                const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn);

                return {
                    suggestions: snippetCompletions
                        .filter((item) => item.languages.includes(language))
                        .map((item) => ({
                            label: item.label,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            detail: item.detail,
                            insertText: item.insert,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            range
                        }))
                };
            }
        });
    });
}
