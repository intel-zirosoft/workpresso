"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
      } else {
        // 성공 시 페이지 이동 및 새로고침
        window.location.href = "/";
      }
    } catch (err) {
      setError("로그인 중 예상치 못한 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-none shadow-float bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-pill flex items-center justify-center mb-2">
            <LogIn className="text-primary w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-headings font-bold text-text">환영합니다!</CardTitle>
          <CardDescription className="font-body text-muted">
            WorkPresso 계정으로 로그인을 진행해 주세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-muted/50" />
                <Input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-primary/20"
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
                  className="pl-10 h-12 bg-background/50 border-none rounded-md focus-visible:ring-primary/20"
                  required
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
            <Button 
              type="submit" 
              className="w-full h-12 rounded-pill font-headings font-bold text-base shadow-soft transition-all hover:scale-[1.02]" 
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "로그인"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-background/50 pt-6">
          <p className="text-sm text-muted font-body">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline">
              지금 가입하기
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
