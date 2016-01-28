package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;

/*
 * Adapter to persist notification objects on JPA   
 */
public interface NotificationRepository extends JpaRepository<Notification, Long> {
}
