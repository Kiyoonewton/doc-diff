import * as Diff from 'diff';

export interface WordChange {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface LineChange {
  lineNumber: number;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldContent?: string;
  newContent?: string;
  wordChanges?: WordChange[];
}

export function computeDiff(oldText: string, newText: string): LineChange[] {
  const changes: LineChange[] = [];
  const lineDiffs = Diff.diffLines(oldText, newText);
  
  let oldLineNum = 1;
  let newLineNum = 1;
  
  lineDiffs.forEach((part) => {
    const lines = part.value.split('\n').filter((line, idx, arr) => {
      // Keep empty lines except the last one if it's empty
      return idx < arr.length - 1 || line.length > 0;
    });
    
    lines.forEach((line, index) => {
      if (part.added) {
        changes.push({
          lineNumber: newLineNum++,
          type: 'added',
          newContent: line,
        });
      } else if (part.removed) {
        changes.push({
          lineNumber: oldLineNum++,
          type: 'removed',
          oldContent: line,
        });
      } else {
        changes.push({
          lineNumber: oldLineNum++,
          type: 'unchanged',
          oldContent: line,
          newContent: line,
        });
        newLineNum++;
      }
    });
  });
  
  // Merge adjacent removed/added lines into modified lines with word-level diff
  const mergedChanges: LineChange[] = [];
  let i = 0;
  
  while (i < changes.length) {
    const current = changes[i];
    const next = changes[i + 1];
    
    if (
      current.type === 'removed' &&
      next &&
      next.type === 'added'
    ) {
      // Compute word-level diff
      const wordDiff = Diff.diffWords(current.oldContent || '', next.newContent || '');
      
      mergedChanges.push({
        lineNumber: current.lineNumber,
        type: 'modified',
        oldContent: current.oldContent,
        newContent: next.newContent,
        wordChanges: wordDiff,
      });
      
      i += 2;
    } else {
      mergedChanges.push(current);
      i++;
    }
  }
  
  return mergedChanges;
}

export function alignChangesForSideBySide(changes: LineChange[]): Array<{
  old: LineChange | null;
  new: LineChange | null;
}> {
  const aligned: Array<{ old: LineChange | null; new: LineChange | null }> = [];
  
  let oldIndex = 0;
  let newIndex = 0;
  const oldChanges = changes.filter(c => c.type === 'removed' || c.type === 'unchanged' || c.type === 'modified');
  const newChanges = changes.filter(c => c.type === 'added' || c.type === 'unchanged' || c.type === 'modified');
  
  // Rebuild from original changes for proper alignment
  changes.forEach((change) => {
    if (change.type === 'unchanged') {
      aligned.push({ old: change, new: change });
    } else if (change.type === 'modified') {
      aligned.push({ old: change, new: change });
    } else if (change.type === 'removed') {
      aligned.push({ old: change, new: null });
    } else if (change.type === 'added') {
      aligned.push({ old: null, new: change });
    }
  });
  
  return aligned;
}
