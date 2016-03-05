package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

/*
 * Adapter to persist client objects on JPA   
 */
public interface PartyRepository  extends JpaRepository<Party, Long> {

    List<Party> findByName(@Param("name") String name);

}
