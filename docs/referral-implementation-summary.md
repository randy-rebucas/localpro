# Referral Program Implementation Summary

## Quick Implementation Checklist

### Frontend Changes Required

1. **Update `src/app/auth/page.tsx`**
   - Add referral code state: `const [referralCode, setReferralCode] = useState<string | null>(null);`
   - Capture `ref` param from URL on page load
   - Store referral code using `storeReferralCode()` from `referral-utils.ts`
   - Include referral code in verify-code API request body

2. **Use Referral Utilities**
   - Import helper functions from `src/lib/referral-utils.ts`
   - Replace manual localStorage/cookie handling with utility functions

### Backend Changes Required

1. **Update `/api/auth/verify-code` endpoint**
   - Accept `referralCode` in request body (optional)
   - When creating new user, check if referral code exists
   - Call referral service to link user to referrer
   - Generate referral code for new user
   - Return `wasReferred` flag in response

2. **Create Referral Service**
   - Validate referral code
   - Find referrer by code
   - Prevent self-referrals
   - Create Referral record
   - Update referrer stats
   - Handle errors gracefully (don't block signup)

## Key Implementation Points

### ✅ Best Practices

1. **Persistence**: Store referral code in both localStorage AND cookie for reliability
2. **Validation**: Validate referral code on backend, don't block signup if invalid
3. **Timing**: Only apply referral during user creation (new users only)
4. **Security**: Prevent self-referrals, duplicate referrals, rate limiting
5. **UX**: Don't disrupt signup flow if referral fails - handle gracefully

### ❌ Common Pitfalls to Avoid

1. ❌ Don't block user registration if referral code is invalid
2. ❌ Don't apply referral to existing users
3. ❌ Don't allow self-referrals
4. ❌ Don't lose referral code on page reload (use proper storage)
5. ❌ Don't forget to clear referral code after successful signup

## Code Snippets

### Frontend: Capture and Store Referral Code

```typescript
import { storeReferralCode, getStoredReferralCode, clearReferralCode, getReferralCodeFromURL } from '@/lib/referral-utils';

// In SignInForm component useEffect
useEffect(() => {
  // Check URL for referral parameter
  const refParam = getReferralCodeFromURL(searchParams);
  if (refParam) {
    storeReferralCode(refParam);
  }
  
  // Check if stored from previous session
  const storedCode = getStoredReferralCode();
  if (storedCode) {
    setReferralCode(storedCode);
  }
}, [searchParams]);
```

### Frontend: Include in Verification Request

```typescript
// In verifyAndSignIn function
const storedReferralCode = getStoredReferralCode();

const response = await fetch(/*...*/, {
  method: "POST",
  body: JSON.stringify({
    phoneNumber,
    code: verificationCode,
    referralCode: storedReferralCode || undefined // Include if available
  })
});

// After successful verification
if (storedReferralCode) {
  clearReferralCode(); // Clean up
}
```

### Backend: Handle Referral on User Creation

```javascript
// In verify-code endpoint
const { phoneNumber, code, referralCode } = req.body;

// ... verify code and check if user exists ...

let isNewUser = false;

if (!user) {
  // User doesn't exist - create them
  user = new User({ phoneNumber });
  user.isVerified = true;
  user.status = 'active';
  isNewUser = true;
  await user.save();
  
  // Handle referral (only for new users)
  if (referralCode) {
    await handleReferralSignup(user, referralCode, req);
  }
  
  // Generate referral code for new user
  user.generateReferralCode();
  await user.save();
}
```

## Testing Checklist

- [ ] Referral code captured from `?ref=CODE` URL parameter
- [ ] Referral code persists in localStorage and cookie
- [ ] Referral code survives page reload
- [ ] Referral code included in verify-code API call
- [ ] New user linked to referrer correctly
- [ ] Referrer stats updated
- [ ] Self-referral prevented
- [ ] Existing user can't be referred again
- [ ] Invalid referral code doesn't block signup
- [ ] Referral code cleared after successful signup

## Files to Modify

### Frontend
- ✅ `src/app/auth/page.tsx` - Add referral code handling
- ✅ `src/lib/referral-utils.ts` - Utility functions (already created)

### Backend (you'll need to implement)
- `src/routes/auth.js` or equivalent - Update verify-code endpoint
- `src/services/referralService.js` or equivalent - Handle referral logic
- `src/models/Referral.js` - Ensure Referral model exists

## Next Steps

1. **Frontend**: Update `auth/page.tsx` to use referral utilities
2. **Backend**: Implement referral handling in verify-code endpoint
3. **Testing**: Test the full flow from referral link to user creation
4. **Analytics**: Add tracking for referral conversions

See `referral-implementation-guide.md` for detailed implementation instructions.

