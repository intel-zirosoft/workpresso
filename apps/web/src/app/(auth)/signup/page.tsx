"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Mail, Lock, User, Building2, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Supabase Auth 회원가입
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          department,
        },
      },
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // 2. 실제 DB의 users 테이블에 정보 기록 (Trigger가 없는 경우 수동 기록)
      const { error: dbError } = await supabase.from("users").upsert({
        id: data.user.id,
        name,
        department,
        status: "ACTIVE",
      });

      if (dbError) {
        console.error("DB Error:", dbError.message);
      }
    }

    alert("가입이 완료되었습니다! 로그인해 주세요.");
    router.push("/login");
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-float bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-secondary/10 rounded-pill flex items-center justify-center mb-2">
            <UserPlus className="text-secondary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-headings font-bold text-text">시작하기</CardTitle>
          <CardDescription className="font-body text-muted">
            WorkPresso와 함께 더 부드러운 협업을 경험하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-muted/50" />
                <Input
                  placeholder="이름"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-secondary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-muted/50" />
                <Input
                  placeholder="소속 부서 (예: 개발팀, 플랫폼실)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-secondary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted/50" />
                <Input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-secondary/20"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-muted/50" />
                <Input
                  type="password"
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-secondary/20"
                  required
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-pill font-headings font-bold text-base shadow-soft bg-secondary hover:bg-secondary/90 text-text transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "가입하기"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-background/50 pt-6">
          <p className="text-sm text-muted font-body">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-secondary font-bold hover:underline">
              로그인하기
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
