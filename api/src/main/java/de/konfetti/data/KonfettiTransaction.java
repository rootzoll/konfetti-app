package de.konfetti.data;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Data
@Entity
@NoArgsConstructor
@RequiredArgsConstructor
public class KonfettiTransaction {

	public static final int TYPE_TASKCREATION = 1;
	public static final int TYPE_TASKSUPPORT = 2;
	public static final int TYPE_TASKREWARD = 3;
	public static final int TYPE_USERWELCOME = 4;
	public static final int TYPE_COUPON = 5;
	public static final int TYPE_PAYBACK = 6;
	public static final int TYPE_SENDBYUSER = 7;
	
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
    private Integer type;
    
    // room for dynamic data in transaction (e.g. coupon)
    private String metaDataJSON;

	
}
