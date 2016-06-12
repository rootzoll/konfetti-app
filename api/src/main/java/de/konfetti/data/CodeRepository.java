package de.konfetti.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

public interface CodeRepository extends JpaRepository<Code, Long> {

    Code findByCode(@Param("code") String code);

}
