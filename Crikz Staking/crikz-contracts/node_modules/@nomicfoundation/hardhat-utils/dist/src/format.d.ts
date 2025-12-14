export type TableRow = string[];
export interface TableDivider {
    type: "divider";
}
export type TableItem = TableRow | TableDivider;
export declare const divider: TableDivider;
/**
 * Formats an array of rows and dividers into a table string.
 *
 * @param items An array of table rows (string arrays) and dividers.
 * Dividers are objects with type: "divider" and will be rendered as table dividers.
 * @returns The formatted table as a string, ready to be rendered.
 *
 * @example
 * ```ts
 * formatTable([
 *   ["Name", "Age"],
 *   divider,
 *   ["Alice", "30"],
 *   ["Bob", "25"],
 *   divider,
 *   ["Average", "27.5"]
 * ]);
 *
 * // =>
 * // | Name    | Age  |
 * // | ------- | ---- |
 * // | Alice   | 30   |
 * // | Bob     | 25   |
 * // | ------- | ---- |
 * // | Average | 27.5 |
 * ```
 */
export declare function formatTable(items: TableItem[]): string;
export interface TableTitleV2 {
    type: "title";
    text: string;
}
export interface TableSectionHeaderV2 {
    type: "section-header";
    text: string;
}
export interface TableHeaderV2 {
    type: "header";
    cells: string[];
}
export interface TableRowV2 {
    type: "row";
    cells: string[];
}
export type TableItemV2 = TableTitleV2 | TableSectionHeaderV2 | TableHeaderV2 | TableRowV2;
/**
 * Formats an array of titles, section headers, headers, and rows into a table
 * string with box-drawing characters.
 *
 * Features:
 * - Titles are centered in a standalone box with double borders (╔═╗)
 * - Section headers group related content with automatic closing
 * - Headers and rows can have different numbers of cells
 * - Rows with fewer cells than max columns are handled with special rendering
 *
 * @param items An array of table items (titles, section headers, headers, and rows).
 * Sections are automatically closed when a new section-header or title appears, or
 * at the end of the table.
 * @returns The formatted table as a string, ready to be rendered.
 *
 * @example
 * ```ts
 * formatTableV2([
 *   { type: "title", text: "My Table" },
 *   { type: "section-header", text: "User Data" },
 *   { type: "header", cells: ["Name", "Age", "City"] },
 *   { type: "row", cells: ["Alice", "30", "NYC"] },
 *   { type: "row", cells: ["Bob", "25", "LA"] },
 *   { type: "section-header", text: "Summary" },
 *   { type: "header", cells: ["Total", "Count"] },
 *   { type: "row", cells: ["55", "2"] }
 * ]);
 *
 * // =>
 * // ╔═══════════════════╗
 * // ║     My Table      ║
 * // ╚═══════════════════╝
 * // ╔═══════════════════╗
 * // ║ User Data         ║
 * // ╟───────┬─────┬─────╢
 * // ║ Name  │ Age │ City║
 * // ╟───────┼─────┼─────╢
 * // ║ Alice │ 30  │ NYC ║
 * // ╟───────┼─────┼─────╢
 * // ║ Bob   │ 25  │ LA  ║
 * // ╚═══════╧═════╧═════╝
 * // ╔═══════════════════╗
 * // ║ Summary           ║
 * // ╟───────┬───────────╢
 * // ║ Total │ Count     ║
 * // ╟───────┼───────────╢
 * // ║ 55    │ 2         ║
 * // ╚═══════╧═══════════╝
 * ```
 */
export declare function formatTableV2(items: TableItemV2[]): string;
//# sourceMappingURL=format.d.ts.map