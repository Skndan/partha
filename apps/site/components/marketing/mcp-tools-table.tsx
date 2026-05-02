import { MCP_TOOLS } from "@/lib/marketing/mcp-tools";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

export function McpToolsTable() {
  return (
    <div className="border-border rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Tool</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[160px]">Scopes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MCP_TOOLS.map((tool) => (
            <TableRow key={tool.name}>
              <TableCell className="font-mono text-sm">{tool.name}</TableCell>
              <TableCell className="text-muted-foreground text-sm">{tool.description}</TableCell>
              <TableCell className="text-muted-foreground font-mono text-xs">{tool.scopes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
