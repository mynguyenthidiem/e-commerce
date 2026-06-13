using E_commerce.Data;
using E_commerce.DTOs.Login;
using E_commerce.Repositories;
using E_commerce.Repositories.Interfaces;
using E_commerce.Services.Interfaces;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.Services
{
    public class LoginService : ILoginService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;

        public LoginService(IUserRepository userRepository, IJwtService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        public async Task<ServiceResponse<LoginResponse>> LoginAsync(LoginRequestDTO dto)
        {
            var response = new ServiceResponse<LoginResponse>();

            var user = await _userRepository.GetByEmailAsync(dto.Email.Trim().ToLower());

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
            {
                response.IsSuccess = false;
                response.Message = "Email or password is incorrect.";
                return response;
            }

            response.Data = new LoginResponse
            {
                Email = user.Email,
                Name = user.Name,
                RoleNames = user.UserRoles.Select(ur => ur.Role?.Name ?? "Customer").ToList(),
                Token = _jwtService.CreateToken(user)
            };
            response.IsSuccess = true;
            response.Message = "Login successful.";
            return response;
        }
    }
}