# Referral Program Implementation Guide
## Best Practices for Mobile Authentication Flow

This guide outlines the recommended implementation approach for your referral program, specifically designed for mobile authentication where users are automatically created when their phone number is not found in the database.

## Overview

Your system uses phone-based authentication with automatic user creation. The referral flow must:
1. Capture referral code from URL parameter (`?ref=CODE`)
2. Persist referral code across the authentication flow
3. Link referral when user is auto-created during verification
4. Handle edge cases (existing users, self-referrals, invalid codes)
5. Prevent referral abuse

## Architecture Flow

```
User clicks referral link → Captures ref param → Stores in localStorage/cookie
  → Enters phone number → Sends code → Verifies code
  → Backend creates user (if new) → Links referral automatically
  → Updates referrer stats → Rewards processing
```

## Implementation Steps

### 1. Frontend: Capture and Store Referral Code

#### 1.1 Extract Referral Code from URL

**File: `src/app/auth/page.tsx`**

Add referral code capture on page load:

```typescript
// In SignInForm component
const [referralCode, setReferralCode] = useState<string | null>(null);

useEffect(() => {
  // Check URL for referral parameter
  const refParam = searchParams.get("ref");
  if (refParam) {
    // Store in localStorage for persistence across page reloads
    localStorage.setItem('referral_code', refParam);
    setReferralCode(refParam);
    
    // Optionally validate referral code immediately
    validateReferralCode(refParam);
  } else {
    // Check if referral code was previously stored
    const storedCode = localStorage.getItem('referral_code');
    if (storedCode) {
      setReferralCode(storedCode);
    }
  }
}, [searchParams]);
```

#### 1.2 Validate Referral Code (Optional but Recommended)

Add validation function to check if referral code is valid before user completes signup:

```typescript
const validateReferralCode = async (code: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.referralsValidate}`,
      createAuthFetchOptions({
        method: 'POST',
        body: JSON.stringify({ referralCode: code })
      })
    );
    
    const result = await response.json();
    
    if (!result.success || !result.data?.isValid) {
      // Invalid code - clear it
      localStorage.removeItem('referral_code');
      setReferralCode(null);
      toast.error('Invalid referral code. Please use a valid code.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to validate referral code:', error);
    // Don't block user flow, just log error
    return true; // Allow to continue, backend will handle validation
  }
};
```

### 2. Frontend: Pass Referral Code During Verification

#### 2.1 Include Referral Code in Verify Request

**File: `src/app/auth/page.tsx`** - Update `verifyAndSignIn` function:

```typescript
const verifyAndSignIn = async (code: string) => {
  setIsLoading(true);
  setErrors({});
  
  try {
    const storedReferralCode = localStorage.getItem('referral_code');
    
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.authVerifyCode}`,
      createAuthFetchOptions({
        method: "POST",
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          code: code,
          referralCode: storedReferralCode || undefined // Include if available
        })
      })
    );

    const result = await response.json();

    if (response.ok && result.success) {
      // Clear referral code after successful signup
      if (storedReferralCode) {
        localStorage.removeItem('referral_code');
      }
      
      // Store token
      if (result.token) {
        const oneWeek = 60 * 60 * 24 * 7;
        const isProd = process.env.NODE_ENV === 'production';
        const secure = isProd ? '; Secure' : '';
        const sameSite = '; SameSite=Lax';
        document.cookie = `api-token=${result.token}; Path=/; Max-Age=${oneWeek}${sameSite}${secure}`;
      }
      
      // Show success message if referred
      if (result.data?.wasReferred) {
        toast.success("Welcome! Your referral has been applied.");
      }
      
      router.push(redirectTo);
    } else {
      toast.error(result.error || "Invalid verification code");
      setErrors({ code: result.error || "Invalid verification code" });
    }
  } catch (error) {
    console.error("Verification error:", error);
    toast.error("Network error. Please try again.");
    setErrors({ code: "Network error. Please try again." });
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Backend Implementation Recommendations

#### 3.1 Update Verify Code Endpoint

**Backend: `/api/auth/verify-code`**

Handle referral code in the verification endpoint:

```javascript
// Pseudocode for backend verification endpoint
router.post('/verify-code', async (req, res) => {
  const { phoneNumber, code, referralCode } = req.body;
  
  // 1. Verify phone number and code
  const user = await User.findOne({ phoneNumber });
  
  if (!user || !user.verifyCode(code)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid verification code' 
    });
  }
  
  let isNewUser = false;
  
  // 2. Check if user exists (auto-create if needed)
  if (!user || user.status === 'pending_verification') {
    // User doesn't exist or is pending - create/activate them
    if (!user) {
      user = new User({ phoneNumber });
      isNewUser = true;
    }
    
    user.isVerified = true;
    user.status = 'active';
    await user.save();
  }
  
  // 3. Handle referral code (only for new users)
  if (isNewUser && referralCode) {
    await handleReferralSignup(user, referralCode, req);
  }
  
  // 4. Generate referral code for new user
  if (isNewUser && !user.referral?.referralCode) {
    user.generateReferralCode();
    await user.save();
  }
  
  // 5. Generate auth token
  const token = generateJWT(user);
  
  res.json({
    success: true,
    data: {
      user: sanitizeUser(user),
      token,
      isNewUser,
      wasReferred: !!user.referral?.referredBy
    }
  });
});
```

#### 3.2 Referral Handling Service

Create a service function to handle referral linking:

```javascript
// services/referralService.js
async function handleReferralSignup(newUser, referralCode, request) {
  try {
    // 1. Find referrer by code
    const referrer = await User.findOne({
      'referral.referralCode': referralCode
    });
    
    if (!referrer) {
      console.warn(`Invalid referral code: ${referralCode}`);
      return; // Silently fail - don't block user registration
    }
    
    // 2. Prevent self-referral
    if (referrer._id.toString() === newUser._id.toString()) {
      console.warn('Self-referral attempted');
      return;
    }
    
    // 3. Check if user was already referred
    if (newUser.referral?.referredBy) {
      console.warn('User already has a referrer');
      return;
    }
    
    // 4. Create Referral record
    const referral = new Referral({
      referrer: referrer._id,
      referee: newUser._id,
      referralCode: referralCode,
      referralType: 'signup',
      status: 'pending',
      tracking: {
        source: extractSource(request), // From UTM params or headers
        ipAddress: request.ip,
        userAgent: request.get('user-agent'),
        referrerUrl: request.get('referer')
      },
      timeline: {
        referredAt: new Date(),
        signupAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      }
    });
    
    await referral.save();
    
    // 5. Update new user with referrer
    newUser.referral.referredBy = referrer._id;
    newUser.referral.referralSource = referral.tracking.source;
    await newUser.save();
    
    // 6. Update referrer stats
    await referrer.updateReferralStats('referral_made');
    
    // 7. Optionally send notifications
    // await sendReferralNotification(referrer, newUser);
    
    return referral;
  } catch (error) {
    console.error('Error handling referral signup:', error);
    // Don't throw - allow user registration to complete
  }
}
```

### 4. Cookie-based Persistence (Alternative/Additional)

For better cross-device and session persistence, also use cookies:

```typescript
// Helper functions for referral code management
export function setReferralCode(code: string) {
  // Store in both localStorage and cookie
  localStorage.setItem('referral_code', code);
  
  const expirationDays = 30; // Referral code valid for 30 days
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + expirationDays);
  
  document.cookie = `referral_code=${code}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`;
}

export function getReferralCode(): string | null {
  // Check cookie first (more reliable)
  const cookieCode = document.cookie
    .split('; ')
    .find(row => row.startsWith('referral_code='))
    ?.split('=')[1];
  
  if (cookieCode) return cookieCode;
  
  // Fallback to localStorage
  return localStorage.getItem('referral_code');
}

export function clearReferralCode() {
  localStorage.removeItem('referral_code');
  document.cookie = 'referral_code=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}
```

### 5. Edge Cases and Security

#### 5.1 Prevent Self-Referrals

Backend validation (already handled in service above):
```javascript
// Check if user is trying to refer themselves
if (referrer.phoneNumber === newUser.phoneNumber) {
  return; // Silently ignore
}
```

#### 5.2 Prevent Duplicate Referrals

```javascript
// Check if referral already exists
const existingReferral = await Referral.findOne({
  referrer: referrer._id,
  referee: newUser._id
});

if (existingReferral) {
  return; // Already referred
}
```

#### 5.3 Handle Existing Users

If a user already exists (phone number found), don't apply referral:
```javascript
// Only apply referral for truly new users
if (!isNewUser && user.referral?.referredBy) {
  // User exists and already has referrer - don't change it
  return;
}
```

#### 5.4 Rate Limiting

Implement rate limiting on referral signups:
```javascript
// Prevent abuse - limit referrals per referrer per day
const todayReferrals = await Referral.countDocuments({
  referrer: referrer._id,
  'timeline.referredAt': {
    $gte: new Date(new Date().setHours(0, 0, 0, 0))
  }
});

if (todayReferrals >= 50) { // Configurable limit
  console.warn('Referral rate limit reached');
  return;
}
```

### 6. Tracking and Analytics

#### 6.1 Track Referral Link Clicks

Update referral-info component to track clicks:

```typescript
// Track when referral link is visited
useEffect(() => {
  const refParam = searchParams.get('ref');
  if (refParam) {
    // Track referral click
    fetch(`${API_BASE_URL}${API_ENDPOINTS.referralsTrack}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referralCode: refParam,
        trackingData: {
          source: 'direct_link',
          utmSource: 'referral_link',
          utmMedium: 'referral',
          ipAddress: undefined, // Backend should capture this
          userAgent: navigator.userAgent
        }
      })
    }).catch(console.error);
  }
}, [searchParams]);
```

### 7. User Experience Enhancements

#### 7.1 Show Referral Success Message

After successful signup with referral:
```typescript
if (result.data?.wasReferred) {
  toast.success(
    `Welcome! You've been referred by ${result.data.referrerName}. Thank you for joining!`
  );
}
```

#### 7.2 Display Referrer Information

Show who referred the user (optional):
```typescript
// In user profile
{profile.referral?.referredBy && (
  <div className="text-sm text-gray-600">
    Referred by: {profile.referrer?.firstName} {profile.referrer?.lastName}
  </div>
)}
```

### 8. Testing Checklist

- [ ] Referral code captured from URL parameter
- [ ] Referral code persists across page reloads
- [ ] Referral code included in verify-code request
- [ ] New user correctly linked to referrer
- [ ] Referrer stats updated correctly
- [ ] Self-referral prevented
- [ ] Existing user referral ignored
- [ ] Invalid referral code handled gracefully
- [ ] Referral code cleared after successful signup
- [ ] Mobile device testing (localStorage/cookies work)

### 9. Database Considerations

#### 9.1 Indexes

Ensure proper indexes exist:
```javascript
// User model indexes
UserSchema.index({ 'referral.referralCode': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'referral.referredBy': 1 });

// Referral model indexes
ReferralSchema.index({ referrer: 1, referee: 1 });
ReferralSchema.index({ referralCode: 1, status: 1 });
ReferralSchema.index({ 'timeline.referredAt': -1 });
```

### 10. Mobile App Considerations

If you have a native mobile app:

1. Use deep linking to capture referral codes
2. Store referral code in secure storage (Keychain/Keystore)
3. Pass referral code in authentication API calls
4. Handle app backgrounding/foregrounding scenarios

## Summary

**Key Implementation Points:**

1. **Frontend**: Capture `ref` param, store in localStorage/cookie, pass to verify-code endpoint
2. **Backend**: Check referral code on user creation, validate referrer, create Referral record, update stats
3. **Security**: Prevent self-referrals, validate codes, rate limiting
4. **UX**: Clear messages, don't block signup flow if referral fails
5. **Persistence**: Use both localStorage and cookies for reliability

**Benefits of This Approach:**

- ✅ Works seamlessly with auto-user-creation flow
- ✅ Persists across sessions and page reloads
- ✅ Handles edge cases gracefully
- ✅ Doesn't block user registration if referral fails
- ✅ Tracks analytics and referral sources
- ✅ Prevents abuse and self-referrals

This implementation ensures referrals work smoothly with your mobile authentication system while maintaining security and a good user experience.

