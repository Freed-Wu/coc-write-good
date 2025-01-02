//# #if HAVE_VSCODE
import { Diagnostic, DiagnosticSeverity, Range, Position } from 'vscode';
//# #elif HAVE_COC_NVIM
//# import { Diagnostic, DiagnosticSeverity, Range, Position } from 'coc.nvim';
//# #endif
import * as WriteGood from 'write-good';

interface Suggestion {
    index: number,
    offset: number,
    reason: string
}

export function lintText(content: string, wgConfig: object, startingLine: number = 0, diagnostics: Diagnostic[] = []) {
    if (content == null) return;
    const lines = content.split(/\r?\n/g);
    lines.forEach((line, lineCount) => {
        const suggestions : Suggestion[] = WriteGood(line, wgConfig);
        suggestions.forEach((suggestion) => {
//# #if HAVE_VSCODE
            const start = new Position(lineCount + startingLine, suggestion.index);
            const end = new Position(lineCount + startingLine, suggestion.index + suggestion.offset);
            diagnostics.push(new Diagnostic(new Range(start, end), suggestion.reason, DiagnosticSeverity.Warning));
//# #elif HAVE_COC_NVIM
//#         const start = Position.create(lineCount + startingLine, suggestion.index);
//#         const end = Position.create(lineCount + startingLine, suggestion.index + suggestion.offset);
//#         diagnostics.push(Diagnostic.create(Range.create(start, end), suggestion.reason, DiagnosticSeverity.Warning));
//# #endif
        });
    });
}
