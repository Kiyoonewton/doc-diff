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
  
  // Merge adjacent removed/added blocks into modified lines with word-level diff
  const mergedChanges: LineChange[] = [];
  let i = 0;

  while (i < changes.length) {
    const current = changes[i];

    // Check if we have a block of removed lines
    if (current.type === 'removed') {
      const removedLines: LineChange[] = [current];
      let j = i + 1;

      // Collect all consecutive removed lines
      while (j < changes.length && changes[j].type === 'removed') {
        removedLines.push(changes[j]);
        j++;
      }

      // Check if followed by added lines
      const addedLines: LineChange[] = [];
      while (j < changes.length && changes[j].type === 'added') {
        addedLines.push(changes[j]);
        j++;
      }

      if (addedLines.length > 0) {
        // Pair up removed and added lines
        const maxLength = Math.max(removedLines.length, addedLines.length);

        for (let k = 0; k < maxLength; k++) {
          const removedLine = k < removedLines.length ? removedLines[k] : null;
          const addedLine = k < addedLines.length ? addedLines[k] : null;

          if (removedLine && addedLine) {
            // Both exist - create modified line with word diff
            const wordDiff = Diff.diffWords(removedLine.oldContent || '', addedLine.newContent || '');
            mergedChanges.push({
              lineNumber: removedLine.lineNumber,
              type: 'modified',
              oldContent: removedLine.oldContent,
              newContent: addedLine.newContent,
              wordChanges: wordDiff,
            });
          } else if (removedLine) {
            // Only removed line
            mergedChanges.push(removedLine);
          } else if (addedLine) {
            // Only added line
            mergedChanges.push(addedLine);
          }
        }

        i = j;
      } else {
        // No added lines following, just push all removed lines
        mergedChanges.push(...removedLines);
        i = j;
      }
    } else {
      // Not a removed line, just push it
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
