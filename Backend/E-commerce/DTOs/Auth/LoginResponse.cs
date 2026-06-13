namespace E_commerce.DTOs.Login
{
    public class LoginResponse
    {
        public string Email { get; set; }
        public string Name { get; set; }
        public List<string> RoleNames { get; set; } = new();
        public string Token { get; set; }
    }
}
