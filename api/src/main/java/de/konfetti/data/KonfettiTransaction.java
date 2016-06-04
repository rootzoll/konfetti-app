package de.konfetti.data;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
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
    private Long amount;
    
	// account where konfetti was transfered to
    private String toAccount;
    
    // account where konfetti came from (can be NULL)
    private String fromAccount;
    
    // time of transaction
    private Long timestamp;
    
    // type of transaction (see finals)
    private Integer type;
    
    // room for dynamic data in transaction (e.g. coupon)
    private String metaDataJSON;
    
    /*
     * Methods
     */
    
    public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Long getAmount() {
		return amount;
	}

	public void setAmount(Long amount) {
		this.amount = amount;
	}

	public String getToAccount() {
		return toAccount;
	}

	public void setToAccount(String toAccount) {
		this.toAccount = toAccount;
	}

	public String getFromAccount() {
		return fromAccount;
	}

	public void setFromAccount(String fromAccount) {
		this.fromAccount = fromAccount;
	}

	public Long getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(Long timestamp) {
		this.timestamp = timestamp;
	}
	
	public Integer getType() {
		return type;
	}

	public void setType(Integer type) {
		this.type = type;
	}

	public String getMetaDataJSON() {
		return metaDataJSON;
	}

	public void setMetaDataJSON(String metaDataJSON) {
		this.metaDataJSON = metaDataJSON;
	}
	
}
