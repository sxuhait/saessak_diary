export type SignupRole = "mentor" | "volunteer";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const SIGNUP_ROLES: SignupRole[] = ["mentor", "volunteer"];

export function isSignupRole(role: string): role is SignupRole {
  return (SIGNUP_ROLES as string[]).includes(role);
}

export function validateSignupInput(input: SignupInput): string | null {
  if (!input.name) {
    return "이름을 입력해주세요.";
  }
  if (!input.email) {
    return "이메일을 입력해주세요.";
  }
  if (!EMAIL_PATTERN.test(input.email)) {
    return "올바른 이메일 형식이 아닙니다.";
  }
  if (!input.password) {
    return "비밀번호를 입력해주세요.";
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    return `비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
  }
  if (!isSignupRole(input.role)) {
    return "역할을 선택해주세요.";
  }
  return null;
}

// 아동센터 관련자만 가입할 수 있도록 초대 코드 등 추가 제한을 걸 자리.
// 지금은 이메일/비밀번호만으로 누구나 가입할 수 있도록 항상 통과시킨다.
export async function checkSignupEligibility(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature kept ready for future eligibility checks
  _input: SignupInput,
): Promise<string | null> {
  return null;
}
