package de.konfetti.service;

import java.util.List;

import de.konfetti.data.Code;
import de.konfetti.data.CodeRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class CodeServiceImpl extends BaseService implements CodeService {

    private static final Logger LOGGER = LoggerFactory.getLogger(CodeServiceImpl.class);

    public CodeServiceImpl() {
    }

    @Autowired
    public CodeServiceImpl(CodeRepository codeRepository) {
        this.codeRepository = codeRepository;
    }

	@Override
	public Code createKonfettiCoupon(Long partyID, Long userID, Long konfettiAmount) {
		Code code = new Code();
		code.setPartyID(partyID);
		code.setActionType(Code.ACTION_TYPE_KONFETTI);
		code.setAmount(konfettiAmount);
		code.setUserID(userID);
		return saveWithUniqueCode(code);
	}

	@Override
	public Code createAdminCode(Long partyID) {
		Code code = new Code();
		code.setPartyID(partyID);
		code.setActionType(Code.ACTION_TYPE_ADMIN);
		return saveWithUniqueCode(code);
	}

	@Override
	public Code createReviewCode(Long partyID) {
		Code code = new Code();
		code.setPartyID(partyID);
		code.setActionType(Code.ACTION_TYPE_REVIEWER);
		return saveWithUniqueCode(code);
	}

	@Override
	public Code redeemByCode(String code) {
		Code codeObject = findByCode(code); 
		if (codeObject==null) return null;
		this.codeRepository.delete(codeObject.getId());
		return codeObject;
	}

	@Override
	public Code findByCode(String code) {
		return codeRepository.findByCode(code);
	}
	
	private Code saveWithUniqueCode(Code code) {
		Code result = null;
		int count = 0;
		do {
			count++;
			try {
				code.setCode(""+Code.generadeCodeNumber());
				result = saveWhenCodeUnique(code);
			} catch (Exception e) {
				LOGGER.warn("Was not able to use code ... will try again");
			}
		} while((result==null) && (count<100));
		if (count>=100) LOGGER.error("Even afer 100 tries ... not unique code found.");
		return result;
	}
	
	private synchronized Code saveWhenCodeUnique(Code code) throws Exception {
		if (findByCode(code.getCode())!=null) throw new Exception("code("+code.getCode()+") already in use");
		return this.codeRepository.saveAndFlush(code);
	}

    
}
