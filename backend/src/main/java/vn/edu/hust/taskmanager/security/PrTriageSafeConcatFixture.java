package vn.edu.hust.taskmanager.security;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Set;

/**
 * Safe false-positive fixture: request input is restricted to fixed SQL identifiers
 * before it is used in the ORDER BY clause. Test only; do not deploy or merge.
 */
public final class PrTriageSafeConcatFixture {
    private static final Set<String> ALLOWED_SORTS = Set.of("title", "created_at");

    private PrTriageSafeConcatFixture() {}

    public static ResultSet findSorted(HttpServletRequest request, Connection connection)
            throws SQLException {
        String requested = request.getParameter("sort");
        String sortColumn = ALLOWED_SORTS.contains(requested) ? requested : "created_at";
        Statement statement = connection.createStatement();
        return statement.executeQuery(
                "SELECT id FROM tasks ORDER BY " + sortColumn);
    }
}
