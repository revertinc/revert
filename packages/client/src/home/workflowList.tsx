import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Link } from "react-router-dom";

interface Column {
  id: "name" | "env" | "deploymentStatus" | "updatedAt";
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: "right" | "left" | "center";
  format?: (value: number | string) => string;
}

const columns: readonly Column[] = [
  { id: "name", label: "Workflow Name", minWidth: 10, maxWidth: 80 },
  {
    id: "env",
    label: "Environment",
    minWidth: 10,
    align: "right",
    maxWidth: 50,
  },
  {
    id: "deploymentStatus",
    label: "Deployment Status",
    minWidth: 10,
    align: "right",
    maxWidth: 50,
  },
  {
    id: "updatedAt",
    label: "Last Updated ",
    minWidth: 50,
    align: "center",
    maxWidth: 100,
    format: (value) => (value ? new Date(value).toDateString() : "N/A"),
  },
];

export default function WorkflowList({ workflows }) {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  // console.log("Workflows", workflows);
  return (
    <>
      <TableContainer sx={{ maxHeight: 520 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {workflows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column, index) => {
                      const value = row[column.id];
                      return (
                        <TableCell
                          key={column.id}
                          align={column.align}
                          style={{
                            maxWidth: column.maxWidth,
                          }}
                        >
                          {index === columns.length - 1 ? (
                            <div className="flex flex-row-reverse items-center justify-between">
                              <Link
                                key={row.id}
                                to={`/workflow/${row.id}`}
                                style={{
                                  padding: "7px 30px",
                                  border: "1px solid #00949D",
                                }}
                              >
                                <div className="text-primary">Edit</div>
                              </Link>

                              <span>
                                {column.format ? column.format(value) : value}
                              </span>
                            </div>
                          ) : (
                            <span>
                              {column.format ? column.format(value) : value}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        style={{
          background: "#fff",
          color: "#3E3E3E",
        }}
        rowsPerPageOptions={[10, 25, 100]}
        component="div"
        count={workflows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  );
}
