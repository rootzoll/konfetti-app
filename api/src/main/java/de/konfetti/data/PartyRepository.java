package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

/*
 * Adapter to persist client objects on JPA   
 */
public interface PartyRepository  extends JpaRepository<Party, Long> {
}
