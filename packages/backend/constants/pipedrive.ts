// Add this interface to all pipedrive get calls
export interface PipedrivePagination {
    additional_data: {
        pagination: {
            start: number;
            limit: number;
            next_start: number;
            more_items_in_collection: boolean;
        };
    };
}