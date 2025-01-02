import { workspace, ExtensionContext, TextDocument, languages, Uri,
    //# #if HAVE_VSCODE
         Diagnostic, DiagnosticCollection } from 'vscode';
    //# #elif HAVE_COC_NVIM
    //#  Diagnostic, DiagnosticCollection } from 'coc.nvim';
    //# #endif
import { lintText } from './linter';

let diagnosticCollection: DiagnosticCollection;
let diagnosticMap: Map<string, Diagnostic[]>;
let lastLint: Map<string, number>;

export function activate(context: ExtensionContext) {

    console.log("Write-Good Linter active...");
    diagnosticCollection = languages.createDiagnosticCollection("Write-Good Lints");
    diagnosticMap = new Map();
    lastLint = new Map();

    if (context == null) return;

    function isWriteGoodLanguage(languageId: string) {
        const wgLanguages: string = workspace.getConfiguration('write-good').get('languages');
        return (wgLanguages.indexOf(languageId) > -1 || wgLanguages === '*');
    }
    
    //# #if HAVE_COC_NVIM
    //# function didOpenTextDocument(document: TextDocument) {
    //#     if (isWriteGoodLanguage(document.languageId)) {
    //#         doLint(document);
    //#     }
    //# }
    //# #endif

    // full lint when document is saved
    context.subscriptions.push(workspace.onDidSaveTextDocument(document => {
        if (isWriteGoodLanguage(document.languageId)) {
            doLint(document);
        }
    }));

    // attempt to only lint changes on motification
    //# #if HAVE_VSCODE
    context.subscriptions.push(workspace.onDidChangeTextDocument(event => {
        if (!isWriteGoodLanguage(event.document.languageId)) {
            // language is unsupported. 
            return;
        }

        const onlyLintOnSave: boolean = workspace.getConfiguration('write-good').get('only-lint-on-save');
        if (onlyLintOnSave) {
            // not a save event, so don't bother linting
            return;
        }

        // debounce linting on editing
        const debounceMs: number = workspace.getConfiguration('write-good').get('debounce-time-in-ms');
        const lastLintMs: number = lastLint.get(event.document.uri.toString()) || 0;
        const nowMs = (new Date()).getTime();
        if (lastLintMs + debounceMs < nowMs) {
            // debounce time is less than now, let's do this
            console.log("LINTING!!!!");
            doLint(event.document);
        }
    }));
    //# #endif

    // full lint on a new document/opened document
    //# #if HAVE_VSCODE
    context.subscriptions.push(workspace.onDidOpenTextDocument(event => {
        if (isWriteGoodLanguage(event.languageId)) {
            doLint(event);
        }
    }));
    //# #elif HAVE_COC_NVIM
    //# context.subscriptions.push(workspace.onDidOpenTextDocument(didOpenTextDocument));
    //# workspace.documents.map((doc) => {
    //#     didOpenTextDocument(doc.textDocument);
    //# });
    //# #endif

    // clean up any lints when the document is closed
    context.subscriptions.push(workspace.onDidCloseTextDocument(event => {
        if (diagnosticMap.has(event.uri.toString())) {
            diagnosticMap.delete(event.uri.toString());
        }
        resetDiagnostics();
    }));
}

export function deactivate() {
    console.log("Write-Good Linter deactivating...");
}

function resetDiagnostics() {
    diagnosticCollection.clear();

    diagnosticMap.forEach((diags, file) => {
    //# #if HAVE_VSCODE
        diagnosticCollection.set(Uri.parse(file), diags);
    //# #elif HAVE_COC_NVIM
    //# diagnosticCollection.set(Uri.parse(file).path, diags);
    //# #endif
    });
}

function getWriteGoodConfig() : object {
    let wgConfig: object = workspace.getConfiguration('write-good').get('write-good-config');
    if (wgConfig === undefined || wgConfig === null) {
        wgConfig = {};
    }
    return wgConfig;
}

function doLint(document: TextDocument) {
    const wgConfig = getWriteGoodConfig();
    const diagnostics: Diagnostic[] = [];
    lintText(document.getText(), wgConfig, 0, diagnostics);

    diagnosticMap.set(document.uri.toString(), diagnostics);
    lastLint.set(document.uri.toString(), (new Date()).getTime());
    resetDiagnostics();
}
