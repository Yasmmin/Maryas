import { motion } from "framer-motion";
import { Heart, Users } from "lucide-react";
import type { UserId } from "@/hooks/useCoupleBackend";

interface UserSwitcherProps {
  currentUser: UserId;
  onChange: (u: UserId) => void;
}

// Alternador entre Usuário A e Usuário B
export const UserSwitcher = ({ currentUser, onChange }: UserSwitcherProps) => {
  const users: { id: UserId; label: string }[] = [
    { id: "A", label: "Yasmmin" },
    { id: "B", label: "Maria" },
  ];

  return (
    <div className="flex items-center gap-3">
      <div className="hidden sm:flex items-center gap-2 text-muted-foreground text-sm">
        <Users className="w-4 h-4" />
        <span>Perfil ativo</span>
      </div>
      <div className="relative flex bg-secondary rounded-full p-1 shadow-soft">
        {users.map((u) => {
          const active = currentUser === u.id;
          return (
            <button
              key={u.id}
              onClick={() => onChange(u.id)}
              className="relative px-4 py-2 text-sm font-medium rounded-full transition-colors z-10"
            >
              {active && (
                <motion.div
                  layoutId="user-pill"
                  className="absolute inset-0 bg-gradient-romance rounded-full shadow-soft"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span
                className={`relative flex items-center gap-1.5 ${
                  active ? "text-primary-foreground" : "text-foreground/70"
                }`}
              >
                {active && <Heart className="w-3.5 h-3.5 fill-current" />}
                {u.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
