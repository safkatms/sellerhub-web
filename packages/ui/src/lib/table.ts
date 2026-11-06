import { tableFeatures, rowSortingFeature, type ColumnDef, type RowData } from "@tanstack/react-table";

export const appFeatures = tableFeatures({ rowSortingFeature });
export type AppColumnDef<T extends RowData> = ColumnDef<typeof appFeatures, T>;