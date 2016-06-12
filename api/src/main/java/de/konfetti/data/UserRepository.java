package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/*
 * Adapter to persist client objects on JPA   
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

//    User findByClientId(Long clientId);

    User findByEMail(String email);
}
