package de.konfetti.data;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import javax.persistence.*;

@Data
@Entity
@NoArgsConstructor
@RequiredArgsConstructor
public class KonfettiTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // the amount of konfetti
	@NonNull
	private Long amount;
    
	// account where konfetti was transfered to
	@NonNull
	private String toAccount;
    
    // account where konfetti came from (can be NULL)
	@NonNull
	private String fromAccount;
    
    // time of transaction
	private Long timestamp = System.currentTimeMillis();

	// type of transaction (see finals)
	@Enumerated(EnumType.ORDINAL)
	private TransactionType type;

	// room for dynamic data in transaction (e.g. coupon)
    private String metaDataJSON;

	
}
