<?php
/**
 * Supabase REST API Helper
 * Provides functions to interact with Supabase without direct PostgreSQL
 */

class SupabaseAPI {
    private $projectUrl = 'https://kpuyiaadnirvnvzjugqz.supabase.co';
    private $anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXlpYWFkbmlydm52emp1Z3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjU1NzAsImV4cCI6MjA4NzQwMTU3MH0.BdeFCxm3m4s_EgIJ8GVbBMzGIM8sWIy6FZwprA87aUc';

    /**
     * Make a REST API request to Supabase
     */
    private function request($method, $table, $query = null, $data = null) {
        $url = $this->projectUrl . '/rest/v1/' . $table;
        
        if ($query) {
            $url .= '?' . http_build_query($query);
        }

        $ch = curl_init($url);
        $headers = [
            'Authorization: Bearer ' . $this->anonKey,
            'Content-Type: application/json',
            'apikey: ' . $this->anonKey,
            'Prefer: return=representation'
        ];

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers
        ]);

        if ($data !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            error_log("Supabase API Error: " . $error);
            return ['error' => $error];
        }

        if ($response === false || $response === '') {
            return $httpCode === 200 || $httpCode === 201 ? [] : ['error' => "HTTP $httpCode"];
        }

        $decoded = json_decode($response, true);
        return $decoded ?? ['error' => 'Invalid response'];
    }

    /**
     * SELECT query
     */
    public function select($table, $filters = []) {
        $query = [];
        foreach ($filters as $key => $value) {
            $query[$key] = $value;
        }
        $query['limit'] = 1000;
        return $this->request('GET', $table, $query);
    }

    /**
     * INSERT query
     */
    public function insert($table, $data) {
        return $this->request('POST', $table, null, $data);
    }

    /**
     * UPDATE query
     */
    public function update($table, $data, $filters = []) {
        $query = [];
        foreach ($filters as $key => $value) {
            $query[$key] = $value;
        }
        return $this->request('PATCH', $table, $query, $data);
    }

    /**
     * DELETE query
     */
    public function delete($table, $filters = []) {
        $query = [];
        foreach ($filters as $key => $value) {
            $query[$key] = $value;
        }
        return $this->request('DELETE', $table, $query);
    }

    /**
     * Get user with role information
     */
    public function getUserWithRole($username) {
        $result = $this->select('users', ['username' => 'eq.' . $username]);
        if (is_array($result) && count($result) > 0) {
            $user = $result[0];
            // Get role info if role_id exists
            if (isset($user['role_id'])) {
                $roles = $this->select('roles', ['id' => 'eq.' . $user['role_id']]);
                if (is_array($roles) && count($roles) > 0) {
                    $user['role_name'] = $roles[0]['name'] ?? 'unknown';
                }
            }
            return $user;
        }
        return null;
    }
}

$supabase = new SupabaseAPI();
?>
