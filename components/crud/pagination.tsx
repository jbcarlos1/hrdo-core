import {
    Pagination,
    PaginationContent,
    PaginationLink,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationProps {
    page: number;
    setPage: React.Dispatch<React.SetStateAction<number>>;
    totalPages: number;
    loading: boolean;
}

export const PaginationComponent = ({
    page,
    setPage,
    totalPages,
    loading,
}: PaginationProps) => {
    const maxPagesToShow = 5;

    const getPageNumbers = () => {
        let startPage = Math.max(1, page - Math.floor(maxPagesToShow / 2));
        let endPage = startPage + maxPagesToShow - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        return Array.from(
            { length: endPage - startPage + 1 },
            (_, i) => startPage + i
        );
    };

    const pageNumbers = getPageNumbers();

    return (
        <Pagination className="mt-3">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious
                        className={
                            page === 1 || loading
                                ? "opacity-50 cursor-default"
                                : ""
                        }
                        href="#"
                        onClick={() => {
                            if (page > 1 && !loading) {
                                setPage(page - 1);
                            }
                        }}
                    />
                </PaginationItem>
                {pageNumbers.map((pageNumber) => (
                    <PaginationItem key={pageNumber}>
                        <PaginationLink
                            href="#"
                            onClick={() => !loading && setPage(pageNumber)}
                            className={page === pageNumber ? "bg-gray-200" : ""}
                        >
                            {pageNumber}
                        </PaginationLink>
                    </PaginationItem>
                ))}
                <PaginationItem>
                    <PaginationNext
                        className={
                            page === totalPages || loading
                                ? "opacity-50 cursor-default"
                                : ""
                        }
                        href="#"
                        onClick={() => {
                            if (page < totalPages && !loading) {
                                setPage(page + 1);
                            }
                        }}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
