package vn.edu.hust.taskmanager.security;

import jakarta.servlet.http.HttpServletRequest;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Intentionally vulnerable, unused fixture for validating the PR triage bot end to end.
 * Do not merge this test branch.
 */
public final class PrTriageE2eVulnerableFixture {
    private PrTriageE2eVulnerableFixture() {}

    public static PreparedStatement unsafeSearch(HttpServletRequest request, Connection connection)
            throws SQLException {
        String term = request.getParameter("q");
        return connection.prepareStatement(
                "SELECT id FROM tasks WHERE title = '" + term + "'");
    }
}
