import React from 'react';
import { GridProps } from '@mantine/core'
import { Grid } from '@/components/ui';
import { DataCard, DataCardProps } from './DataCard';

export interface DataItem extends Omit<DataCardProps, 'className'> {
  /** Unique identifier for the data item */
  id: string;
}

export interface DataGridProps extends Omit<GridProps, 'children'> {
  /** Array of data items to display */
  items: DataItem[];
  /** Number of columns for different breakpoints */
  columns?: { 
    /** Number of columns on extra small screens */
    xs?: number;
    /** Number of columns on small screens */
    sm?: number;
    /** Number of columns on medium screens */
    md?: number;
    /** Number of columns on large screens */
    lg?: number;
    /** Number of columns on extra large screens */
    xl?: number;
  };
  /** Whether the grid is loading */
  loading?: boolean;
}

/**
 * Grid of data cards for displaying key metrics with responsive layout
 */
export function DataGrid({
  items,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 4 },
  loading = false,
  ...gridProps
}: DataGridProps) {
  return (
    <Grid gutter="md" {...gridProps}>
      {items.map((item) => (
        <Grid.Col 
          key={item.id} 
          xs={columns.xs} 
          sm={columns.sm} 
          md={columns.md} 
          lg={columns.lg} 
          xl={columns.xl}
        >
          <DataCard 
            {...item} 
            loading={loading}
          />
        </Grid.Col>
      ))}
    </Grid>
  );
}