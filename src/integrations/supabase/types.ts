export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      access_logs: {
        Row: {
          error_message: string | null
          id: string
          ip_address: unknown | null
          metodo_http: string
          rota_acessada: string
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metodo_http: string
          rota_acessada: string
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metodo_http?: string
          rota_acessada?: string
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          bloqueado_ate: string | null
          email: string
          id: string
          ip_address: unknown
          tentativas: number
          ultima_tentativa: string
        }
        Insert: {
          bloqueado_ate?: string | null
          email: string
          id?: string
          ip_address: unknown
          tentativas?: number
          ultima_tentativa?: string
        }
        Update: {
          bloqueado_ate?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          tentativas?: number
          ultima_tentativa?: string
        }
        Relationships: []
      }
      payment_logs: {
        Row: {
          data_recebimento: string
          erro: string | null
          fonte: string
          id: string
          payload_raw: Json
          payment_id: string
          processado: boolean
          transaction_id: string | null
        }
        Insert: {
          data_recebimento?: string
          erro?: string | null
          fonte: string
          id?: string
          payload_raw: Json
          payment_id: string
          processado?: boolean
          transaction_id?: string | null
        }
        Update: {
          data_recebimento?: string
          erro?: string | null
          fonte?: string
          id?: string
          payload_raw?: Json
          payment_id?: string
          processado?: boolean
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      raffle_numbers: {
        Row: {
          created_at: string
          id: string
          numero: number
          reservation_expires_at: string | null
          reserved_at: string | null
          reserved_by: string | null
          sold_at: string | null
          sold_to: string | null
          status: Database["public"]["Enums"]["number_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          numero: number
          reservation_expires_at?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          sold_to?: string | null
          status?: Database["public"]["Enums"]["number_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          numero?: number
          reservation_expires_at?: string | null
          reserved_at?: string | null
          reserved_by?: string | null
          sold_at?: string | null
          sold_to?: string | null
          status?: Database["public"]["Enums"]["number_status"]
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          confirmacao_enviada: boolean
          created_at: string
          data_confirmacao: string | null
          data_pagamento: string | null
          data_transacao: string
          email: string
          id: string
          metodo_pagamento: string
          nome: string
          numeros_comprados: number[]
          payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_session_id: string | null
          telefone: string | null
          tentativas_pagamento: number
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          confirmacao_enviada?: boolean
          created_at?: string
          data_confirmacao?: string | null
          data_pagamento?: string | null
          data_transacao?: string
          email: string
          id?: string
          metodo_pagamento: string
          nome: string
          numeros_comprados: number[]
          payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          telefone?: string | null
          tentativas_pagamento?: number
          updated_at?: string
          user_id: string
          valor_total: number
        }
        Update: {
          confirmacao_enviada?: boolean
          created_at?: string
          data_confirmacao?: string | null
          data_pagamento?: string | null
          data_transacao?: string
          email?: string
          id?: string
          metodo_pagamento?: string
          nome?: string
          numeros_comprados?: number[]
          payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_session_id?: string | null
          telefone?: string | null
          tentativas_pagamento?: number
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          created_at: string | null
          data_recebimento: string | null
          erro: string | null
          fonte: string | null
          id: string
          payload_raw: Json | null
          payment_id: string | null
          processado: boolean | null
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_recebimento?: string | null
          erro?: string | null
          fonte?: string | null
          id?: string
          payload_raw?: Json | null
          payment_id?: string | null
          processado?: boolean | null
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_recebimento?: string | null
          erro?: string | null
          fonte?: string | null
          id?: string
          payload_raw?: Json | null
          payment_id?: string | null
          processado?: boolean | null
          transaction_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      finalize_sale: {
        Args:
          | { _user_id: string; _numeros: number[]; _transaction_id: string }
          | { _user_id: string; _numeros: number[]; _transaction_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      liberar_numeros: {
        Args: { _numeros: number[] }
        Returns: boolean
      }
      log_access: {
        Args: {
          _user_id: string
          _rota: string
          _metodo: string
          _ip?: unknown
          _user_agent?: string
          _success?: boolean
          _error?: string
        }
        Returns: undefined
      }
      reserve_numbers: {
        Args: {
          _user_id: string
          _numeros: number[]
          _minutes_to_expire?: number
        }
        Returns: {
          success: boolean
          message: string
          reserved_numbers: number[]
          failed_numbers: number[]
        }[]
      }
    }
    Enums: {
      number_status: "disponivel" | "reservado" | "vendido"
      payment_status:
        | "pendente"
        | "processando"
        | "pago"
        | "cancelado"
        | "expirado"
      user_role: "user" | "organizer" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      number_status: ["disponivel", "reservado", "vendido"],
      payment_status: [
        "pendente",
        "processando",
        "pago",
        "cancelado",
        "expirado",
      ],
      user_role: ["user", "organizer", "admin"],
    },
  },
} as const
