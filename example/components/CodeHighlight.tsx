/**
 * A tiny, dependency-free syntax highlighter for the TypeScript/TSX source shown
 * in a sample's Code tab. It tokenizes with a small hand-written scanner (robust
 * to strings, template literals, and comments) and renders colored nested
 * `<Text>` spans — no web-only libraries, so it works reliably in React Native.
 */
import { Fragment } from 'react';
import { StyleSheet, Text } from 'react-native';

type TokenType = 'comment' | 'string' | 'keyword' | 'number' | 'jsx' | 'text';
type Token = { type: TokenType; text: string };

const KEYWORDS = new Set([
  'import', 'export', 'from', 'as', 'default', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break',
  'continue', 'new', 'class', 'extends', 'implements', 'interface', 'type',
  'enum', 'async', 'await', 'yield', 'this', 'super', 'typeof', 'instanceof',
  'in', 'of', 'void', 'delete', 'try', 'catch', 'finally', 'throw', 'null',
  'undefined', 'true', 'false', 'static', 'public', 'private', 'readonly',
  'get', 'set',
]);

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const push = (type: TokenType, text: string) => {
    if (text) tokens.push({ type, text });
  };
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const c2 = src[i + 1];
    if (c === '/' && c2 === '/') {
      let j = src.indexOf('\n', i);
      if (j < 0) j = n;
      push('comment', src.slice(i, j));
      i = j;
    } else if (c === '/' && c2 === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      push('comment', src.slice(i, j));
      i = j;
    } else if (c === "'" || c === '"' || c === '`') {
      let j = i + 1;
      while (j < n && src[j] !== c) {
        if (src[j] === '\\') j++;
        j++;
      }
      j = Math.min(j + 1, n);
      push('string', src.slice(i, j));
      i = j;
    } else if (/[A-Za-z_$]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const w = src.slice(i, j);
      // Capitalized identifiers read as components/types (JSX-ish accent).
      push(KEYWORDS.has(w) ? 'keyword' : /^[A-Z]/.test(w) ? 'jsx' : 'text', w);
      i = j;
    } else if (/[0-9]/.test(c)) {
      let j = i + 1;
      while (j < n && /[0-9._eExXa-fA-F]/.test(src[j])) j++;
      push('number', src.slice(i, j));
      i = j;
    } else {
      push('text', c);
      i++;
    }
  }
  return tokens;
}

export function CodeHighlight({ source }: { source: string }) {
  const tokens = tokenize(source);
  return (
    <Text style={styles.code}>
      {tokens.map((t, idx) => (
        <Fragment key={idx}>
          <Text style={styles[t.type]}>{t.text}</Text>
        </Fragment>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  code: { fontFamily: 'Menlo', fontSize: 12, lineHeight: 18, color: '#1c1c1e' },
  comment: { color: '#6a737d', fontStyle: 'italic' },
  string: { color: '#b45309' },
  keyword: { color: '#7c3aed' },
  number: { color: '#005cc5' },
  jsx: { color: '#0b7285' },
  text: { color: '#1c1c1e' },
});
