import { AbstractParser, EnclosingContext } from '../../constants';
import * as py_ast from 'python-ast';

const processNode = (
  node: any,
  lineStart: number,
  lineEnd: number,
  largestSize: number,
  largestEnclosingContext: any
) => {
  // The start and end positions of the node
  const { start, end } = node;

  // If the node is within the range of the lines
  if (start.line <= lineStart && lineEnd <= end.line) {
    // Calculate the size of the node
    const size = end.line - start.line;
    if (size > largestSize) {
      largestSize = size;
      largestEnclosingContext = node;
    }
  }

  // Return the largest size and the largest enclosing context
  return { largestSize, largestEnclosingContext };
};

export class PythonParser implements AbstractParser {
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext {
    try {
      // Parse the file
      const parsedFile = py_ast.parse(file);
      let largestEnclosingContext: any = null;
      let largestSize = 0;

      // Function to traverse the AST
      const traverseNode = (node: any) => {
        ({ largestSize, largestEnclosingContext } = processNode(
          node,
          lineStart,
          lineEnd,
          largestSize,
          largestEnclosingContext
        ));
        if (node.body) {
          node.body.forEach(traverseNode); // Recursively process child nodes
        }
      };

      // Start traversing the AST
      traverseNode(parsedFile);

      return {
        enclosingContext: largestEnclosingContext,
      } as EnclosingContext;
    } catch (error) {
      return {
        enclosingContext: null,
      };
    }
  }
  dryRun(file: string): { valid: boolean; error: string } {
    // Try to parse the file
    try {
      py_ast.parse(file);
      return {
        valid: true,
        error: '',
      };
      // If there is an error, return the error message
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }
}
