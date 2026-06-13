using E_commerce.Data;
using E_commerce.DTOs.Auth;
using E_commerce.Models;
using E_commerce.Repositories.Interfaces;
using E_commerce.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace E_commerce.Services
{
    public class RegisterService : IRegisterService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;

        public RegisterService(IUserRepository userRepository, IRoleRepository roleRepository)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
        }

        public async Task<ServiceResponse<UserInfoResponse>> RegisterAsync(RegisterRequest dto)
        {
            var response = new ServiceResponse<UserInfoResponse>();

            var email = dto.Email.Trim().ToLower();
            var name = dto.Name.Trim();
            var phoneNumber = dto.PhoneNumber.Trim();

            if (!await _userRepository.IsEmailUniqueAsync(email))
            {
                response.IsSuccess = false;
                response.Message = "Email already exists.";
                return response;
            }
            var role = await _roleRepository.GetByNameAsync("Customer");
            if (role == null)
            {
                response.IsSuccess = false;
                response.Message = "Default role 'Customer' not found in system.";
                return response;
            }

            var user = new User
            {
                Name = name,
                Email = email,
                PhoneNumber = phoneNumber,
                Password = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                FullName = name,
                UserRoles = new List<UserRole> { new UserRole { RoleId = role.Id } }
            };

            await _userRepository.AddAsync(user);
            var saveResult = await _userRepository.SaveChangesAsync();

            if (!saveResult)
            {
                response.IsSuccess = false;
                response.Message = "An error occurred while saving the user.";
                return response;
            }

            response.IsSuccess = true;
            response.Message = "Registration successful";
            response.Data = new UserInfoResponse { Email = dto.Email, Name = dto.Name };
            return response;
        }
    }
}
