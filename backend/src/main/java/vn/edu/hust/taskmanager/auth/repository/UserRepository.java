package vn.edu.hust.taskmanager.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.hust.taskmanager.auth.model.User;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
