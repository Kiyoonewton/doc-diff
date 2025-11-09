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

  let i = 0;
  while (i < changes.length) {
    const current = changes[i];

    if (current.type === 'unchanged') {
      // Unchanged lines appear on both sides
      aligned.push({ old: current, new: current });
      i++;
    } else if (current.type === 'modified') {
      // Modified lines appear on both sides with different content
      aligned.push({ old: current, new: current });
      i++;
    } else if (current.type === 'removed') {
      // Look for consecutive removed and added lines to pair them
      const removedLines: LineChange[] = [current];
      let j = i + 1;

      // Collect all consecutive removed lines
      while (j < changes.length && changes[j].type === 'removed') {
        removedLines.push(changes[j]);
        j++;
      }

      // Collect all consecutive added lines
      const addedLines: LineChange[] = [];
      while (j < changes.length && changes[j].type === 'added') {
        addedLines.push(changes[j]);
        j++;
      }

      // Pair up removed and added lines
      const maxLength = Math.max(removedLines.length, addedLines.length);
      for (let k = 0; k < maxLength; k++) {
        aligned.push({
          old: k < removedLines.length ? removedLines[k] : null,
          new: k < addedLines.length ? addedLines[k] : null,
        });
      }

      i = j;
    } else if (current.type === 'added') {
      // Added line without a corresponding removed line
      aligned.push({ old: null, new: current });
      i++;
    }
  }

  return aligned;
}
