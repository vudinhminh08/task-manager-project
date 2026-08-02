package vn.edu.hust.taskmanager.task.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TaskPageResponseTest {

    @Test
    void exposesPageItemsAndMetadataForServerSidePagination() {
        TaskPageResponse response = new TaskPageResponse(List.of(), 2, 10, 24, 3);

        assertThat(response.items()).isEmpty();
        assertThat(response.page()).isEqualTo(2);
        assertThat(response.size()).isEqualTo(10);
        assertThat(response.totalItems()).isEqualTo(24);
        assertThat(response.totalPages()).isEqualTo(3);
    }
}
